const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const { workspaceOwnerValidator } = require('../../../src/features/workspace/workspace.utils');
const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const UserModel = require('../../../src/features/user/user.model');

describe('Workspace service - removeMember', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when missing paramater/s', async () => {
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

        await expect(
            WorkspaceService.removeMember(null, null, null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });
        expect(WorkspaceModel.findOne).not.toHaveBeenCalled();
        expect(UserModel.findById).not.toHaveBeenCalled();
    });

    it('should throw 403 when trying to remove workspace owner', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

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
            WorkspaceService.removeMember(mockUser._id, 'tester', 'team-a', mockUser._id)
        ).rejects.toMatchObject({ status: 403, message: 'Cannot remove workspace owner' });
        expect(mockWorkspace.save).not.toHaveBeenCalled();
    });

    it('should throw 404 when workspace not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

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
            WorkspaceService.removeMember(mockUser._id, 'tester', 'team-a', '123')
        ).rejects.toMatchObject({ status: 404, message: 'Workspace not found' });

        expect(mockWorkspace.save).not.toHaveBeenCalled();
        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', owner: mockUser._id }
        );
    });

    it('should throw 404 when user not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

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
        jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

        await expect(
            WorkspaceService.removeMember(mockUser._id, 'tester', 'team-a', '123')
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });

        expect(mockWorkspace.save).not.toHaveBeenCalled();
        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', owner: mockUser._id }
        );
    });

    it('should throw 404 when user not found in members', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const mockMember = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: mockUser._id,
                members: [
                    { user: mockUser._id, role: 'admin'},
                ]
            }
        );

        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);
        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockMember);

        await expect(
            WorkspaceService.removeMember(mockUser._id, 'tester', 'team-a', mockMember._id)
        ).rejects.toMatchObject({ status: 404, message: 'User not found in members' });

        expect(mockWorkspace.save).not.toHaveBeenCalled();
        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', owner: mockUser._id }
        );
    });

    it('should remove member and return updated workspace', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const mockMember = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: mockUser._id,
                members: [
                    { user: mockUser._id, role: 'admin'},
                    { user: mockMember._id, role: 'member'}
                ]
            }
        );

        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);
        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockMember);

        const result = await WorkspaceService.removeMember(mockUser._id, 'tester', 'team-a', mockMember._id);
        
        expect(result).toEqual(mockWorkspace);
        expect(mockWorkspace.save).toHaveBeenCalled();
        expect(result.members).toEqual([
            { user: mockUser._id, role: 'admin' }
        ]);
        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            { deleted: false, slug: 'team-a', owner: mockUser._id }
        );
    });

    it('should throw when database error occurs', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const mockMember = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: mockUser._id,
                members: [
                    { user: mockUser._id, role: 'admin'},
                    { user: mockMember._id, role: 'member'}
                ]
            }
        );

        mockWorkspace.save = jest.fn().mockResolvedValue(mockWorkspace);
        const dbError = new Error('DB connection failed');
        jest.spyOn(WorkspaceModel, 'findOne').mockRejectedValue(dbError);

        await expect(
            WorkspaceService.removeMember(mockUser._id, 'tester', 'team-a', mockMember._id)
        ).rejects.toThrow('DB connection failed');
    });
});
