const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockInvite } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const { workspaceOwnerValidator } = require('../../../src/features/workspace/workspace.utils');
const WorkspaceInviteModel = require('../../../src/features/workspace/workspace.invite.model');

describe('Workspace service - cancelInvite', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when missing parameter/s', async () => {
        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockResolvedValue(null);

        await expect(
            WorkspaceService.cancelInvite(null, null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });
        expect(workspaceOwnerValidator).not.toHaveBeenCalled();
        expect(WorkspaceInviteModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should cancel the matched invite', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const inviteId = new mongoose.Types.ObjectId();
        const workspaceId = new mongoose.Types.ObjectId();
        const inviteeId = new mongoose.Types.ObjectId();

        const mockInvite = createMockInvite(
            {
                deleted: true,
                _id: inviteId,
                ownerId: mockUser._id,
                workspaceId,
                inviteeId,
                status: 'pending',
            }
        )
        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockResolvedValue(mockInvite);

        const result = await WorkspaceService.cancelInvite(mockUser._id, 'tester', inviteId);

        expect(result).toEqual(mockInvite);
        expect(WorkspaceInviteModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                deleted: false,
                ownerId: mockUser._id,
                _id: inviteId,
                status: 'pending'
            },
            { deleted: true },
            { new: true }
        );
        expect(result).toHaveProperty('deleted', true);
    });

    it('should throw 404 when invite not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);
        const mockInvitee = createMockUser({ _id: new mongoose.Types.ObjectId() });

        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockResolvedValue(null);

        await expect(
            WorkspaceService.cancelInvite(mockUser._id, 'tester', mockInvitee._id)
        ).rejects.toMatchObject({ status: 404, message: 'Invite not found' });
    });
    
    it('should throw when database error occurs', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);
        const mockInvitee = createMockUser({ _id: new mongoose.Types.ObjectId() });

        const dbError = new Error('DB connection failed');
        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockRejectedValue(dbError);

        await expect(
            WorkspaceService.cancelInvite(mockUser._id, 'tester', mockInvitee._id)
        ).rejects.toThrow('DB connection failed');
    });
});