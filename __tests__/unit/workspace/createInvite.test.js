const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace, createMockInvite } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const { workspaceOwnerValidator } = require('../../../src/features/workspace/workspace.utils');
const WorkspaceInviteModel = require('../../../src/features/workspace/workspace.invite.model');

describe('Workspace service - createInvite', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 404 when workspace not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const workspaceId = new mongoose.Types.ObjectId();
        const inviteeId = new mongoose.Types.ObjectId();

        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(null);

        await expect(
            WorkspaceService.createInvite(mockUser._id, 'tester', inviteeId, workspaceId)
        ).rejects.toMatchObject({ status: 404, message: 'Workspace not found' });

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith({ owner: mockUser._id, _id: workspaceId });
    });

    it('should throw 409 when user is already a member', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const mockInvitee = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace(
            {
                _id: workspaceId,
                name: 'team a',
                slug: 'team-a',
                owner: mockUser._id,
                members: [
                    { user: mockInvitee._id, role: 'member' }
                ],
            }
        );
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        await expect(
            WorkspaceService.createInvite(mockUser._id, 'tester', mockInvitee._id, mockWorkspace._id)
        ).rejects.toMatchObject({ status: 409, message: 'User is already a member' });
    });

    it('should return invite and message when pending invite exist', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const inviteId = new mongoose.Types.ObjectId();
        const workspaceId = new mongoose.Types.ObjectId();

        const mockWorkspace = createMockWorkspace({ _id: workspaceId, owner: mockUser._id, name: 'team beta', slug: 'team-beta' });
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        const mockInviteeId = new mongoose.Types.ObjectId();
        const mockInvite = createMockInvite(
            {
                _id: inviteId,
                ownerId: mockUser._id,
                workspaceId: mockWorkspace._id,
                inviteeId: mockInviteeId,
                status: 'pending',
            }
        );
        jest.spyOn(WorkspaceInviteModel, 'findOne').mockResolvedValue(mockInvite);
        jest.spyOn(WorkspaceInviteModel, 'create').mockResolvedValue(null);

        const result = await WorkspaceService.createInvite(mockUser._id, 'tester', mockInviteeId, mockWorkspace._id);

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith({ owner: mockUser._id, _id: workspaceId });
        expect(WorkspaceInviteModel.findOne).toHaveBeenCalledWith({workspaceId, inviteeId: mockInviteeId, status: 'pending' });
        expect(result).toEqual({
            reused: true,
            invite: mockInvite,
            message: 'There is a pending invite for this user',
        });
        expect(WorkspaceInviteModel.create).not.toHaveBeenCalled();
    });

    it('should throw 422 when failed to create invite', async() => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);
       
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace({ _id: workspaceId, owner: mockUser._id, name: 'team beta', slug: 'team-beta' });
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        const mockInviteeId = new mongoose.Types.ObjectId();
        jest.spyOn(WorkspaceInviteModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(WorkspaceInviteModel, 'create').mockResolvedValue(null);

        await expect(
            WorkspaceService.createInvite(mockUser._id, 'tester', mockInviteeId, mockWorkspace._id)
        ).rejects.toMatchObject({ status: 422, message: 'Unknown error occured' });
    });

    it('should create invite with pending as status', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);
       
        const workspaceId = new mongoose.Types.ObjectId();
        const mockWorkspace = createMockWorkspace({ _id: workspaceId, owner: mockUser._id, name: 'team beta', slug: 'team-beta' });
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValue(mockWorkspace);

        const inviteId = new mongoose.Types.ObjectId();
        const mockInviteeId = new mongoose.Types.ObjectId();
        const mockInvite = createMockInvite(
            {
                _id: inviteId,
                ownerId: mockUser._id,
                workspaceId: mockWorkspace._id,
                inviteeId: mockInviteeId,
                status: 'pending',
            }
        );
        jest.spyOn(WorkspaceInviteModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(WorkspaceInviteModel, 'create').mockResolvedValue(mockInvite);

        const result = await WorkspaceService.createInvite(mockUser._id, 'tester', mockInviteeId, mockWorkspace._id);

        expect(result).toEqual(mockInvite);
        expect(result.status).toEqual('pending');
        expect(result).not.toHaveProperty('deleted', true);
        expect(WorkspaceModel.findOne).toHaveBeenCalledWith({ owner: mockUser._id, _id: mockWorkspace._id });
        expect(WorkspaceInviteModel.findOne).toHaveBeenCalledWith({ workspaceId: mockWorkspace._id, inviteeId: mockInviteeId, status: 'pending' });
        expect(WorkspaceInviteModel.create).toHaveBeenCalledWith({ ownerId: mockUser._id, workspaceId: mockWorkspace._id, inviteeId: mockInviteeId });
    });
});