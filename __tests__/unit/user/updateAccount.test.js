const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const { createMockUser, expectSafeUser } = require('../../helpers/user.helper');

describe('User service - updateAccount', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should update username', async () => {
        const mockUser = createMockUser({ username: 'newName' });
        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(mockUser);

        const result = await UserService.updateAccount('123', { username: 'newName' });

        expect(result.username).toEqual('newName');
        expectSafeUser(result, { username: 'newName' });
    });

    it('should ignore disallowed fields', async () => {
        const mockUser = createMockUser({});
        const spy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(mockUser);

        await UserService.updateAccount('123', { role: 'admin' });

        expect(spy).toHaveBeenCalledWith('123', {}, { new: true });
    });

    it('should throw 404 if user not found', async () => {
        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(null);

        await expect(
            UserService.updateAccount('123', { username: 'newName' })
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });
    });

    it('should throw if database error occurs', async () => {
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'findByIdAndUpdate').mockRejectedValue(dbError);

        await expect(
            UserService.updateProfile('123', { username: 'newName' })
        ).rejects.toThrow('DB connection failed');
    });
});