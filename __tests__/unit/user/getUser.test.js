const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const { createMockUser } = require('../../helpers/user.helper');
const { toSafeUser } = require('../../../src/features/user/user.utils');

describe('User service - getUser', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when missing parameter/s', async () => {
        const mockUser = createMockUser({})
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

        await expect(
            UserService.getUser(mockUser._id, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });
        
        expect(UserModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw 401 when access is unauthorized', async () => {
        const mockUser = createMockUser({});
        jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

        await expect(
            UserService.getUser(mockUser._id, 'test')
        ).rejects.toMatchObject({ status: 401, message: 'Unauthorized' });

        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, _id: mockUser._id });
    });

    it('should throw 404 when user not found', async () => {
        const mockUser = createMockUser({});
        jest.spyOn(UserModel, 'findOne') 
            .mockResolvedValueOnce(mockUser)    // for 'me'
            .mockResolvedValueOnce(null);       // for 'user'

        await expect(
            UserService.getUser(mockUser._id, 'test')
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });

        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, username: 'test' });
    });

    it('should return safe user when found', async () => {
        const mockUser = createMockUser({});
        jest.spyOn(UserModel, 'findOne') 
            .mockResolvedValueOnce(mockUser)    // for 'me'
            .mockResolvedValueOnce(mockUser);       // for 'user'
        
        const result = await UserService.getUser(mockUser._id, 'tester');

        expect(result).toEqual(toSafeUser(mockUser));
    });

    it('should throw when database error occurs', async () => {
        const mockUser = createMockUser({});
        const dbError = new Error('DB connection failed');
        jest.spyOn(UserModel, 'findOne').mockRejectedValue(dbError);

        await expect(
            UserService.getUser(mockUser._id, 'tester')
        ).rejects.toThrow('DB connection failed');
    });
});