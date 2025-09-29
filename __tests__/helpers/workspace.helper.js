const mongoose = require('mongoose');

const createMockWorkspace = (overrides = {}) => {
    const baseWorkspace = {
        _id: '123',
        deleted: false,
        name: 'My Workspace',
        slug: 'my-workspace',
        owner: '123',
        members: [
            { user: '123', role: 'admin' },
            { user: '456', role: 'member' },
            { user: '789', role: 'member' },
        ],
    }

    const workspace = { ...baseWorkspace, ...overrides };
    return {
        ...workspace,
        toObject: () => ({ ...workspace })
    }
};

const createMockInvite = (overrides = {}) => {
    const baseInvite = {
        deleted: false,
        _id: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId(),
        inviteeId: new mongoose.Types.ObjectId(),
        status: 'pending',
    }

    const invite = { ...baseInvite, ...overrides };
    return invite;
}

module.exports = {
    createMockWorkspace,
    createMockInvite,
}