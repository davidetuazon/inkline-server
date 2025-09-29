const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');
jest.mock('../../../src/features/workspace/workspace.utils', () => ({
  workspaceOwnerValidator: jest.fn(),
}));
const { workspaceOwnerValidator } = require('../../../src/features/workspace/workspace.utils');

describe('Workspace service - updateName', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when parameter/s are missing', async () => {
        const userId = new mongoose.Types.ObjectId();

        await expect(
            WorkspaceService.updateName(null, null, null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });
    });

    it('should update workspace name', async() => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const mockWorkspace = createMockWorkspace({ name: 'Team Alpha', slug: 'team-alpha', owner: mockUser._id });
        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.updateName(mockUser._id, 'tester', 'my-org', { name: 'Team Alpha', slug: 'team-alpha' });

        expect(result).toEqual(mockWorkspace);
        expect(WorkspaceModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                deleted: false,
                slug: 'my-org',
                owner: mockUser._id
            },
            {
                name: 'Team Alpha',
                slug: 'team-alpha'
            },
            { new: true }
        );
    });

    it('should ignore disallowed fields', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const mockOwner = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        const mockWorkspace = createMockWorkspace({ name: 'Team Alpha', slug: 'team-alpha', owner: mockUser._id });
        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(mockWorkspace);

        const result = await WorkspaceService.updateName(
            mockUser._id,
            'tester',
            'my-org',
            {
                name: 'Team Alpha',
                slug: 'team-alpha',
                owner: mockOwner._id,
            }
        );

        expect(result).toEqual(mockWorkspace);
        expect(result.owner).not.toEqual(mockOwner._id);
        expect(WorkspaceModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                deleted: false,
                slug: 'my-org',
                owner: mockUser._id,
            },
            {
                name: 'Team Alpha',
                slug: 'team-alpha',
            },
            { new: true }
        );
    });

    it('should throw 404 when workspace not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        workspaceOwnerValidator.mockResolvedValue(mockUser);

        jest.spyOn(WorkspaceModel, 'findOneAndUpdate').mockResolvedValue(null);

        await expect(
            WorkspaceService.updateName(mockUser._id, 'tester', 'my-team', { name: 'team a', slug: 'team-a' })
        ).rejects.toMatchObject({ status: 404, message: 'Workspace not found' });

        expect(WorkspaceModel.findOneAndUpdate).toHaveBeenCalledWith(
            {
                deleted: false,
                slug: 'my-team',
                owner: mockUser._id
            },
            {
                name: 'team a',
                slug: 'team-a'
            },
            { new: true }
        );
    });
});