const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace, createMockInvite } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const { workspaceOwnerValidator } = require('../../../src/features/workspace/workspace.utils');

describe('Workspace service - delete', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when parameter/s are missing', async () => {
        const userId = new mongoose.Types.ObjectId();

        await expect(
            WorkspaceService.delete(null, null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });
    });

    it('should return deleted workspace', async () => {
        const mockUser = createMockUser({});
        workspaceOwnerValidator.mockResolvedValueOnce(mockUser);

        const mockWorkspace = createMockWorkspace({ deleted: true, slug: 'my-org', owner: mockUser._id });
        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.delete(mockUser._id, 'tester', 'my-org');

        expect(result).toEqual(mockWorkspace);
        expect(result).toHaveProperty('deleted', true);
        expect(WorkspaceModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                deleted: false,
                slug: 'my-org',
                owner: mockUser._id,
            },
            { deleted: true },
            { new: true }
        );
    });

    it('should throw 404 when workspace not found', async () => {
        const mockUser = createMockUser({});
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(null);

        await expect(
            WorkspaceService.delete(mockUser._id, 'tester', 'my-org')
        ).rejects.toMatchObject({ status: 404, message: 'Workspace not found' });

        expect(WorkspaceModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                deleted: false,
                slug: 'my-org',
                owner: mockUser._id,
            },
            { deleted: true },
            { new: true }
        );
    });

    it('should throw when database error occurs', async () => {
        const mockUser = createMockUser({});
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const dbError = new Error('DB connection failed');
        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockRejectedValue(dbError);

        await expect(
            WorkspaceService.delete(mockUser._id, 'tester', 'my-org')
        ).rejects.toThrow('DB connection failed');
    });
});
