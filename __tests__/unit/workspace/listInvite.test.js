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
});