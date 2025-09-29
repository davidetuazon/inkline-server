const WorkspaceService = require('./workspace.service');
const UserService = require('../user/user.service');
const validate = require('validate.js');
const constraints = require('./workspace.validation');
const { slugify } = require('./workspace.utils');

exports.createWorkspace = async (req, res, next) => {
    const params = {...req.body};
    params.slug = slugify(params.name);

    const issues = validate(params, constraints.create);
    if (issues) return res.status(422).json({ error: e.message });

    try {
        const workspace = await WorkspaceService.create(req.user._id, params);
        
        res.status(201).json({ success: true, message: 'Workspace created successfully', workspace });
    } catch (e) {
        if (e.code == 11000 && e.keyPattern?.name) {
            return res.status(409).json({ error: `Workspace name already exists on this account` });
        }
        res.status(500).json({ error: e.message });
    }
};

exports.listWorkspace = async (req, res, next) => {
    const { search, page = 1, limit = 8 } = req.query;

    try {
        const options = {
            page: parseInt(page, 1) || 1,
            limit: parseInt(limit, 8) || 8,
        }

        const list = await WorkspaceService.findAll(req.user._id, search || "", options);

        res.json(list);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getWorkspace = async (req, res, next) => {
    const { username, slug } = req.params;
    
    const issues = validate({ username, slug }, {
        username: { presence: true },
        slug: { presence: true }
    });
    if (issues) return res.status(422).json({ error: issues });

    try {
        const workspace = await WorkspaceService.find(req.user._id, username, slug);
        if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

        res.json(workspace);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteWorkspace = async (req, res, next) => {
    const { username, slug } = req.params;
    
    const issues = validate({ username, slug }, {
        username: { presence: true },
        slug: { presence: true }
    });
    if (issues) return res.status(422).json({ error: issues });

    try {
        await WorkspaceService.delete(req.user._id, username, slug);
        res.send(201).json({ success: true, message: 'Workspace deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateWorkspaceName = async (req, res, next) => {
    const { username, slug } = req.params;

    const updates = {...req.body};
    updates.slug = slugify(updates.name);
    
    const issues = validate({ username, slug }, {
        username: { presence: true },
        slug: { presence: true }
    });
    const updateIssues = validate(updates, constraints.updateName);

    if (issues) return res.status(422).json({ error: issues });
    if (updateIssues) return res.status(422).json({ error: updateIssues });

    try {
        const workspace = await WorkspaceService.updateName(req.user._id, username, slug, updates);
        if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

        res.json(workspace);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.sendWorkspaceInvite = async (req, res, next) => {
    const { username } = req.params;
    const {inviteeUsername, workspaceId } = req.body;

    const issues = validate({ username, workspaceId, inviteeUsername }, {
        username: { presence: true },
        workspaceId: { presence: true },
        inviteeUsername : { presence: true },
    });

    if (issues) return res.status(422).json({ error: issues });

    try {
        const invitee = await UserService.getUser(req.user._id, inviteeUsername);
        if (!invitee) return res.status(404).json({ error: 'User not found' });

        const invite = await WorkspaceService.createInvite(req.user._id, username, invitee._id, workspaceId);
        if (!invite) return res.status(422).json({ error: 'Failed to create invite' });

        res.json(invite);
    } catch (e) {
        if (e.code === 11000 && e.keyPattern?.inviteeId) {
            return res.status(409).json({ error: 'There is a pending invite for this user' });
        }
        res.status(500).json({ error: e.message });
    }
};

exports.cancelWorkspaceInvite = async (req, res, next) => {
    const { username, inviteId } = req.params;
    const issues = validate({ username, inviteId }, {
        username: { presence: true },
        inviteId: { presence: true }
    });
    if (issues) return res.status(422).json({ error: issues });

    try {
        const invite = await WorkspaceService.cancelInvite(req.user._id, username, inviteId);
        if (!invite) return res.status(422).json({ error: 'Something went wrong' });

        res.json(invite);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.listWorkspaceInvite = async (req, res, next) => {
    const { page = 1, limit = 5 } = req.query;

    try {
         const options = {
            page: parseInt(page, 1) || 1,
            limit: parseInt(limit, 5) || 5,
         }

         const list = await WorkspaceService.listInvite(req.user._id, options);

         res.json(list);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.handleWorkspaceInvite = async (req, res, next) => {
    const { workspaceId, inviteeId, action } = req.body;

    const issues = validate({ action, workspaceId, inviteeId }, {
        action: { presence: true },
        workspaceId: { presence: true },
        inviteeId: { presence: true },
    });
    if (issues) return res.status(422).json({ error: issues });

    try {
        const response = await WorkspaceService.handleInvite(req.user._id, workspaceId, inviteeId, action);
        if (!response) return res.status(422).json({ error: 'Something went wrong' });

        res.json(response);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.removeWorkspaceMember = async (req, res, next) => {
    const { username, slug, memberId } = req.params;
    const issues = validate({ username, slug, memberId }, {
        username: { presence: true },
        slug: { presence: true },
        memberId: { presence: true }
    });
    if (issues) return res.status(422).json({ error: issues });

    try {
        const workspace = await WorkspaceService.removeMember(req.user._id, username, slug, memberId);
        if (!workspace) return res.status(422).json({ error: 'Something went wrong' });

        res.json(workspace);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.leaveWorkspace = async (req, res, next) => {
    const { username, slug } = req.params;
    const issues = validate({ username, slug}, {
        username: { presence: true },
        slug: { presence: true }
    });
    if (issues) return res.status(422).json({ error: issues });

    try {
        const workspace = await WorkspaceService.leaveWorkspace(req.user._id, username, slug);
        if (!workspace) return res.status(422).json({ error: 'Something went wrong' });

        res.json(workspace);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}