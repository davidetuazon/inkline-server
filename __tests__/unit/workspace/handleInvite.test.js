const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockInvite, createMockWorkspace } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const WorkspaceInviteModel = require('../../../src/features/workspace/workspace.invite.model');
const WorkspaceModel = require('../../../src/features/workspace/workspace.model');

describe('Workspace service - handleInvite', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when action is invalid', async () => {
        const userId = new mongoose.Types.ObjectId();
        const workspaceId = new mongoose.Types.ObjectId();

        await expect(
            WorkspaceService.handleInvite(userId, workspaceId, userId, 'ongoing')
        ).rejects.toMatchObject({ status: 400, message: 'Invalid action' });
    });

    it('should throw 403 when user id does not match invitee id', async () => {
        const userId = new mongoose.Types.ObjectId();
        const workspaceId = new mongoose.Types.ObjectId();
        const inviteeId = new mongoose.Types.ObjectId();

        await expect(
            WorkspaceService.handleInvite(userId, workspaceId, inviteeId, 'accepted')
        ).rejects.toMatchObject({ status: 403, message: 'You can only act on your own invites' });
    });

    it('should throw 404 when invite not found or expired', async () => {
        const userId = new mongoose.Types.ObjectId();
        const workspaceId = new mongoose.Types.ObjectId();

        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockResolvedValue(null);

        await expect(
            WorkspaceService.handleInvite(userId, workspaceId, userId, 'accepted')
        ).rejects.toMatchObject({ status: 404, message: 'Invite not found or expired' });
    });

    it("(if action === 'accepted') should update invite status to 'accepted' and add user to workspace", async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const ownerId = new mongoose.Types.ObjectId();
        const action = 'accepted';

        const mockInvite = createMockInvite(
            {
                deleted: false,
                _id: new mongoose.Types.ObjectId(),
                ownerId: ownerId,
                workspaceId,
                inviteeId: mockUser._id,
                status: action,
            }
        );
        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockResolvedValue(mockInvite);

        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'Team A',
                slug: 'team-a',
                owner: ownerId,
                members: [
                    { user: ownerId, role: 'admin'},
                    { user: mockUser._id, role: 'member'}
                ]
            }
        );
        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.handleInvite(mockUser._id, workspaceId, mockUser._id, action);

        expect(result.workspace).toEqual(mockWorkspace);
        expect(result.invite).toEqual(mockInvite);
        expect(result.invite.status).toBe('accepted');

        expect(WorkspaceInviteModel.findOneAndUpdate).toHaveBeenCalledWith(
            { workspaceId, inviteeId: mockUser._id, status: 'pending'},
            { status: action },
            { new: true }
        );
        expect(WorkspaceModel.findOneAndUpdate).toHaveBeenCalledWith(
            { deleted: false, _id: workspaceId, 'members.user': { $ne: mockUser._id } },
            { $push: { members: { user: mockUser._id, role: 'member' } } },
            { new: true }
        );
    });

    it("(if action === 'declined') should update invite status to 'declined' and return invite", async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const ownerId = new mongoose.Types.ObjectId();
        const action = 'declined';

         const mockInvite = createMockInvite(
            {
                deleted: false,
                _id: new mongoose.Types.ObjectId(),
                ownerId: ownerId,
                workspaceId,
                inviteeId: mockUser._id,
                status: action,
            }
        );
        jest.spyOn(WorkspaceInviteModel, 'findOneAndUpdate').mockResolvedValue(mockInvite);
        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(null);

        const result = await WorkspaceService.handleInvite(mockUser._id, workspaceId, mockUser._id, action);

        expect(result).toEqual(mockInvite);
        expect(WorkspaceModel.findOneAndUpdate).not.toHaveBeenCalled();
        expect(WorkspaceInviteModel.findOneAndUpdate).toHaveBeenCalledWith(
            { workspaceId, inviteeId: mockUser._id, status: 'pending'},
            { status: action },
            { new: true }
        );
    });
});