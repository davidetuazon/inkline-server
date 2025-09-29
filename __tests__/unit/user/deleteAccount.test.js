const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const { createMockUser, expectSafeUser } = require('../../helpers/user.helper');

describe('User service - deleteAccount', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should delete user', async () => {
        const mockUser = createMockUser({ deleted: true });

        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(mockUser);

        const result = await UserService.deleteAccount('123');

        expect(result).toHaveProperty('deleted', true);
        expectSafeUser(result, { _id: '123' });
    });

    it('should throw 404 if user not found', async () => {
        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(null);

        await expect(
            UserService.deleteAccount('123')
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });
    });

    it('should throw if database error occurs', async () => {
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'findByIdAndUpdate').mockRejectedValue(dbError);

        await expect(
            UserService.deleteAccount('123')
        ).rejects.toThrow('DB connection failed');
    })
});