const UserModel = require('../user/user.model');
const WorkspaceModel = require('./workspace.model');
const WorkspaceInviteModel = require('./workspace.invite.model');
const { workspaceOwnerValidator } = require('./workspace.utils');
const { allowedUpdates } = require('../../shared/helpers/service.utils');
const { setCache, getCache, clearCache, clearAllCache } = require('../../cache/redis-cache');

exports.createWorkspace = async (userId, params) => {
    if (!params) throw {status: 400, message: 'Missing request body' };

    try {
        if (!params.members) {
            params.members = [];
        }

        const alreadyMember = params.members.some(m => m.user.toString() === userId.toString());
        if (!alreadyMember) {
            params.members.push({ user: userId, role: 'admin' });
        }

        const workspace = await WorkspaceModel.create({ ...params, owner: userId });
        return workspace.toObject();
    } catch(e) {
        throw(e);
    }
};

exports.findAll = async (userId, query = "", options = {}) => {
    const cacheKey = `workspaceOwner:${userId}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
        let filter = {
            deleted: false,
            $or: [
                { owner: userId },
                { 'members.user' : userId },
            ]
        };

        if (query) {
            filter.$text = { $search: query };
        };

        const paginateOptions = {
            page: parseInt(options.page) || 1,
            limit: parseInt(options.limit) || 8,
            sort: options.sort || { createdDate: -1 },
            lean: true,
            populate: { path: 'owner', select: 'email username' }
        };

        const workspaces = await WorkspaceModel.paginate(filter, paginateOptions);

        setCache(cacheKey, workspaces);
        return workspaces;
    } catch (e) {
        throw(e);
    }
}

exports.find = async (userId, username, slug) => {
    if (!username || !slug) throw { status: 400, message: 'Missing parameter/s' };

    const cacheKey = `workspace:${username}:${slug}:${userId}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
        const owner = await UserModel.findOne({ deleted: false, username: username });
        if (!owner) throw { status: 404, message: 'User not found' };

        let filter = {
            deleted: false,
            slug: slug
        };

        if (userId.toString() === owner._id.toString()) {
            filter.$or = [
                { owner: userId },
                { 'members.user': userId },
            ];
        } else {
            filter = {
                ...filter,
                owner: owner._id,
                'members.user': userId,
            };
        };

        const workspace = await WorkspaceModel
            .findOne(filter)
            .populate([
                { path: 'owner', select: 'email username' },
                { path: 'members.user', select: 'email username fullName' }
            ])
            .lean();
        if (!workspace) throw { status: 404, message: 'Workspace not found' };

        setCache(cacheKey, workspace);
        return workspace;
    } catch (e) {
        throw(e);
    }
};

exports.delete = async (userId, username, slug) => {
    if (!username || !slug) throw { status: 400, message: 'Missing parameter/s' };

    const cacheKey = `workspace:${username}:${slug}:${userId}`;

    try {
        const owner = await workspaceOwnerValidator(userId, username);
        const filter = {
            deleted: false,
            slug,
            owner: owner._id,
        };

        const deletedWorkspace = await WorkspaceModel.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!deletedWorkspace) throw { status: 404, message: 'Workspace not found' };

        clearCache(cacheKey);
        return deletedWorkspace;
    } catch (e) {
        throw(e);
    }
}

exports.updateName = async (userId, username, slug, updates = {}) => {
    if (!username || !slug) throw { status: 400, message: 'Missing parameter/s' };

    const safeUpdates = allowedUpdates(['name', 'slug'], updates);
    if(Object.keys(safeUpdates).length === 0) throw { status: 400, message: "Updates can't be null" };

    const oldCacheKey = `workspace:${username}:${slug}:${userId}`;
    const newSlug = safeUpdates.slug || slug;
    const newCacheKey = `workspace:${username}:${newSlug}:${userId}`;


    try {
        const owner = await workspaceOwnerValidator(userId, username);

        const filter = {
            deleted: false,
            slug,
            owner: owner._id,
        };
        const updatedWorkspace = await WorkspaceModel.findOneAndUpdate(filter, safeUpdates, { new: true });
        if (!updatedWorkspace) throw { status: 404, message: 'Workspace not found' };

        if (safeUpdates.slug && safeUpdates.slug !== slug) {
            clearCache(oldCacheKey);
        }

        setCache(newCacheKey, updatedWorkspace);
        return updatedWorkspace;
    } catch (e) {
        throw(e);
    }
};

exports.createInvite = async (userId, username, inviteeId, workspaceId) => {
    try {
        const owner = await workspaceOwnerValidator(userId, username);

        const workspace = await WorkspaceModel.findOne({ owner: owner._id, _id: workspaceId });
        if (!workspace) throw { status: 404, message: 'Workspace not found' };

        if (workspace.members.some(m => (m.user._id ? m.user._id.toString() : m.user.toString()) === inviteeId.toString())) {
            throw { status: 409, message: 'User is already a member' };
        }

        let existingInvite = await WorkspaceInviteModel.findOne({
            workspaceId,
            inviteeId,
            status: 'pending',
        });
        if (existingInvite) return { reused: true, invite: existingInvite, message: 'There is a pending invite for this user' };

        const invite = await WorkspaceInviteModel.create({
            ownerId: owner._id,
            workspaceId,
            inviteeId,
        });
        if (!invite) throw { status: 422, message: 'Unknown error occured' };

        return invite;
    } catch (e) {
        throw(e);
    }
};

exports.cancelInvite = async (userId, username, inviteId) => {
    if (!username || !inviteId) throw { status: 400, message: 'Missing parameter/s' };

    try {
        const owner = await workspaceOwnerValidator(userId, username);
        let filter = { 
            deleted: false,
            ownerId: owner._id,
            _id: inviteId,
            status: 'pending',
        }

        const canceledInvite = await WorkspaceInviteModel.findOneAndUpdate(filter, { deleted: true }, { new: true });
        if (!canceledInvite) throw { status: 404, message: 'Invite not found' };

        return canceledInvite;
    } catch (e) {
        throw(e);
    }
};

exports.listInvite = async (userId, options = {}) => {
    try {
        let filter = {
            deleted: false,
            inviteeId: userId,
            status: 'pending'
        };

        const paginateOptions = {
            page: parseInt(options.page) || 1,
            limit: parseInt(options.limit) || 5,
            sort: options.sort || { createdDate: -1 },
            lean: true,
            populate: [
                { path: 'workspaceId', select: 'slug ' },
                { path: 'ownerId', select: 'username fullName'}
            ]
        };

        return await WorkspaceInviteModel.paginate(filter, paginateOptions);
    } catch (e) {
        throw(e);
    }
}

exports.handleInvite = async (userId, workspaceId, inviteeId, action) => {
    if (!['accepted', 'declined'].includes(action)) {
        throw { status: 400, message: 'Invalid action' };
    }
    
    if (userId.toString() !== inviteeId.toString()) {
        throw { status: 403, message: 'You can only act on your own invites' };
    }
    try {
        const invite = await WorkspaceInviteModel.findOneAndUpdate(
            { workspaceId, inviteeId, status: 'pending' },
            { status: action },
            { new: true }
        );
        if (!invite) throw { status: 404, message: 'Invite not found or expired' };

        if (action === 'accepted') {
            const workspace = await WorkspaceModel.findOneAndUpdate(
                { deleted: false, _id: workspaceId, 'members.user': { $ne: inviteeId } },
                { $push: { members: { user: inviteeId, role: 'member' } } },
                { new: true }
            );
        return { workspace, invite };
        }

        return invite;
    } catch (e) {
        throw(e);
    }
};

exports.removeMember = async (userId, username, slug, memberId) => {
    if (!username || !slug) throw { status: 400, message: 'Missing parameter/s' };

    try {
        const owner = await workspaceOwnerValidator(userId, username);
        let filter = {
            deleted: false,
            slug,
            owner: owner._id,
        };

        if (owner._id.toString() === memberId.toString()) {
            throw { status: 403, message: 'Cannot remove workspace owner' }
        };

        const workspace = await WorkspaceModel.findOne(filter);
        if (!workspace) throw { status: 404, message: 'Workspace not found' };

        const validUser = await UserModel.findById(memberId);
        if (!validUser) throw { status: 404, message: 'User not found' };
    
        const isMember = workspace.members.some(m => m.user.toString() === validUser._id.toString());
        if (!isMember) throw { status: 404, message: 'User not found in members' };

        workspace.members = workspace.members.filter(m => m.user.toString() !== validUser._id.toString());
        await workspace.save();

        return workspace;
    } catch (e) {
        throw(e);
    }
};

exports.leaveWorkspace = async (userId, username, slug) => {
    if (!username || !slug) throw { status: 400, message: 'Missing parameter/s' };

    try {
        const filter = {
            deleted: false,
            slug,
            'members.user': userId,
        }

        const workspace = await WorkspaceModel.findOne(filter);
        if (!workspace) throw { status: 404, message: 'Workspace not found' };

        if (workspace.owner.toString() === userId.toString()) {
            throw { status: 403, message: 'Cannot leave your own workspace' };
        }

        const isMember = workspace.members.some(m => m.user.toString() === userId.toString());
        if (!isMember) throw { status: 404, message: 'User not found in members' };

        workspace.members = workspace.members.filter(m => m.user.toString() !== userId.toString());
        await workspace.save();

        return workspace;
    } catch (e) {
        throw(e);
    }
};