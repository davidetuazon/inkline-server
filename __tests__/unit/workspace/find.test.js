const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const UserModel = require('../../../src/features/user/user.model');
const WorkspaceService = require('../../../src/features/workspace/workspace.service');
const { createMockWorkspace } = require('../../helpers/workspace.helper');
const { createMockUser } = require('../../helpers/user.helper');
const mongoose = require('mongoose');

describe('Workspace service - find', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when parameter/s are missing', async () => {
        const userId = new mongoose.Types.ObjectId();
        jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValueOnce(null);

        await expect(
            WorkspaceService.find(null, null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });

        expect(UserModel.findOne).not.toHaveBeenCalled();
        expect(WorkspaceModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw 404 when user not found', async () => {
        const userId = new mongoose.Types.ObjectId();
        jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
        jest.spyOn(WorkspaceModel, 'findOne').mockResolvedValueOnce(null);

        await expect(
            WorkspaceService.find(userId, 'tester', 'my-org')
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });

        expect(WorkspaceModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw 404 when workspace not found', async () => {
        const userId = new mongoose.Types.ObjectId();

        const mockUser = createMockUser({ _id: userId });
        jest.spyOn(UserModel, 'findOne')
            .mockResolvedValueOnce(mockUser)  //me
            .mockResolvedValueOnce(mockUser); //owner
        
        const queryMock = {
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        };
        jest.spyOn(WorkspaceModel, 'findOne').mockReturnValue(queryMock);

        await expect(
            WorkspaceService.find(userId, 'tester', 'my-org')
        ).rejects.toMatchObject({ status: 404, message: 'Workspace not found' });

        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, _id: userId });
    });

    it('should return workspace when user is the owner', async () => {
        const userId = new mongoose.Types.ObjectId();
        
        const mockUser = createMockUser({ _id: userId });
        jest.spyOn(UserModel, 'findOne')
            .mockResolvedValueOnce(mockUser)  //me
            .mockResolvedValueOnce(mockUser); //owner

        const mockWorkspace = createMockWorkspace({ slug: 'my-org', owner: userId });
        const queryMock = {
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockWorkspace),
        };
        jest.spyOn(WorkspaceModel, 'findOne').mockReturnValue(queryMock);

        const result = await WorkspaceService.find(userId, 'tester', 'my-org');

        expect(result).toEqual(mockWorkspace);
        expect(result.owner).toEqual(userId);
        expect(result).not.toHaveProperty('deleted', true);

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                deleted: false,
                slug: 'my-org',
                $or: [
                    { owner: userId },
                    { 'members.user': userId },
                ],
            })
        );
        expect(queryMock.populate).toHaveBeenCalledWith([
            { path: 'owner', select: 'email username' },
            { path: 'members.user', select: 'email username fullName' }
        ]);
    });

    it('should return workspace when is user is a member', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        const mockOwner = createMockUser({ _id: new mongoose.Types.ObjectId() });
        jest.spyOn(UserModel, 'findOne')
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockOwner);

        const mockWorkspace = createMockWorkspace({ slug: 'my-org', owner: mockOwner._id });
        const queryMock = {
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockWorkspace),
        };
        jest.spyOn(WorkspaceModel, 'findOne').mockReturnValue(queryMock);

        const result = await WorkspaceService.find(mockUser._id, 'tester', 'my-org');

        expect(result).toEqual(mockWorkspace);
        expect(result.owner).not.toEqual(mockUser._id);
        expect(result).not.toHaveProperty('deleted', true);

        expect(WorkspaceModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                deleted: false,
                slug: 'my-org',
                owner: mockOwner._id,
                'members.user': mockUser._id,
            })
        );
        expect(queryMock.populate).toHaveBeenCalledWith([
            { path: 'owner', select: 'email username' },
            { path: 'members.user', select: 'email username fullName' }
        ]);
    });

    it('should throw when database error occurs', async () => {
        const userId = new mongoose.Types.ObjectId();
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'findOne').mockRejectedValue(dbError);

        await expect(
            WorkspaceService.find(userId, 'tester', 'my-org')
        ).rejects.toThrow('DB connection failed');
    });
});