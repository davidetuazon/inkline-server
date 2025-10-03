const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockInvite } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const { workspaceOwnerValidator } = require('../../../src/features/workspace/workspace.utils');
const WorkspaceInviteModel = require('../../../src/features/workspace/workspace.invite.model');

describe('Workspace service - listInvite', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call paginate with correct base filters', async () =>{
        WorkspaceInviteModel.paginate = jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

        const userId = new mongoose.Types.ObjectId();
        await WorkspaceService.listInvite(userId);

        expect(WorkspaceInviteModel.paginate).toHaveBeenCalledWith(
            expect.objectContaining({
                deleted: false,
                inviteeId: userId,
                status: 'pending'
            }),
            expect.any(Object)
        );
    });

    it('should throw when database error occurs', async () => {
        const dbError = new Error('DB connection failed'); 
        WorkspaceInviteModel.paginate = jest.fn().mockRejectedValue(dbError);

        const userId = new mongoose.Types.ObjectId();
        await expect(
            WorkspaceService.listInvite(userId)
        ).rejects.toThrow('DB connection failed');
    });
});