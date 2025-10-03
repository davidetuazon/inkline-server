const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const WorkspaceModel = require('../../../src/features/workspace/workspace.model');

describe('Workspace service - leaveWorkspace', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when missing parameter/s', async () => {
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(null);

        await expect(
            WorkspaceService.leaveWorkspace(null, null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });
        expect(WorkspaceModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw 404 when workspace not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });

        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: mockUser._id,
                members: [
                    { user: mockUser._id, role: 'admin'}
                ]
            }
        );

        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(null);

        await expect(
            WorkspaceService.leaveWorkspace(mockUser._id, 'tester', 'team-a')
        ).rejects.toMatchObject({ status: 404, message: 'Workspace not found' });

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', 'members.user': mockUser._id }
        );
        expect(mockWorkspace.save).not.toHaveBeenCalled();
    });

    it('should throw 403 when owner tries to leave own workspace', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: mockUser._id,
                members: [
                    { user: mockUser._id, role: 'admin'}
                ]
            }
        );
        
        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        await expect(
            WorkspaceService.leaveWorkspace(mockUser._id, 'tester', 'team-a')
        ).rejects.toMatchObject({ status: 403, message: 'Cannot leave your own workspace' });

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', 'members.user': mockUser._id }
        );
        expect(mockWorkspace.save).not.toHaveBeenCalled();
    });

    it('should throw 404 when user is not found in members', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const ownerId = new mongoose.Types.ObjectId(); 
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: ownerId,
                members: [
                    { user: ownerId, role: 'admin'}
                ]
            }
        );
        
        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        await expect(
            WorkspaceService.leaveWorkspace(mockUser._id, 'tester', 'team-a')
        ).rejects.toMatchObject({ status: 404, message: 'User not found in members' });

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', 'members.user': mockUser._id }
        );
        expect(mockWorkspace.save).not.toHaveBeenCalled();
    });

    it('should leave and return updated workspace', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const ownerId = new mongoose.Types.ObjectId(); 
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: ownerId,
                members: [
                    { user: ownerId, role: 'admin'},
                    { user: mockUser._id, role: 'member' }
                ]
            }
        );
        
        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.leaveWorkspace(mockUser._id, 'tester', 'team-a');

        expect(result).toEqual(mockWorkspace);
        expect(mockWorkspace.save).toHaveBeenCalled();
        expect(result.members.some(m => m.user.toString() === mockUser._id.toString())).toBe(false);
        expect(result.members).toEqual([
            { user: ownerId, role: 'admin' }
        ]);
        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', 'members.user': mockUser._id }
        );
    });

    it('should throw when database error occurs', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const ownerId = new mongoose.Types.ObjectId(); 
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: ownerId,
                members: [
                    { user: ownerId, role: 'admin'},
                    { user: mockUser._id, role: 'member' }
                ]
            }
        );
        
        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        const dbError = new Error('DB connection failed');
        jest.spyOn(WorkspaceModel, 'findOne').mockRejectedValue(dbError);

        await expect(
            WorkspaceService.leaveWorkspace(mockUser._id, 'tester', 'team-a')
        ).rejects.toThrow('DB connection failed');
    });
});