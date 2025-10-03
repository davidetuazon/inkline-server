const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace } = require('../../helpers/workspace.helper');
const mongoose = require('mongoose');

describe('Workspace service - create', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it(' should throw 400 when request body is missing', async () => {
        const userId = new mongoose.Types.ObjectId();

        await expect(
            WorkspaceService.createWorkspace(userId, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing request body'});
    });

    it('should set current logged user as owner', async () => {
        const mockWorkspace = createMockWorkspace({ name: 'My Org', slug: 'my-org' });

        jest.spyOn(WorkspaceModel, 'create').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.createWorkspace('123', { name: 'My Org', slug: 'my-org' });

        expect(result.name).toEqual('My Org');
        expect(result.slug).toEqual('my-org');
        expect(result.owner).toEqual('123');
    });

    it('should add owner as admin to the list of members', async () => {
        const mockWorkspace = createMockWorkspace({ name: 'My Org', slug: 'my-org' });

        jest.spyOn(WorkspaceModel, 'create').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.createWorkspace('123', { name: 'My Org', slug: 'my-org' });

        const ownerMember = result.members.find(m => m.role === 'admin');
        expect(ownerMember.user).toEqual('123');

        result.members.forEach(m => {
            expect(m).toHaveProperty('user');
            expect(m).toHaveProperty('role');
        });
    });

    it('should throw when database error occurs', async () => {
        const userId = new mongoose.Types.ObjectId();
        const dbError = new Error('DB connection failed');

        jest.spyOn(WorkspaceModel, 'create').mockRejectedValue(dbError);

        await expect(
            WorkspaceService.createWorkspace(userId, {name: 'test' })
        ).rejects.toThrow('DB connection failed');
    });
});
