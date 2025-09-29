const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const bcrypt = require('bcryptjs');
const { createMockUser, expectSafeUser } = require('../../helpers/user.helper');

describe('User service - changeEmail', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should update email when password matches', async () => {
        const hashedPassword = 'password';
        const mockUser = createMockUser({ password: hashedPassword, email: 'mock@email.com' });
        
        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

        const spy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(mockUser);

        const result = await UserService.changeEmail('123', { email: 'mock@email.com', password: hashedPassword });

        expect(spy).toHaveBeenCalledWith('123', { email: 'mock@email.com' }, { new: true });
        expectSafeUser(result, { email: 'mock@email.com' });
    });

    it('should throw 409 when password is incorrect', async () => {
        const hashedPassword = 'password';
        const mockUser = createMockUser({ password: hashedPassword, email: 'mock@email.com' });

        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(
            UserService.changeEmail('123', { password: hashedPassword, email: 'mock@email.com' })
        ).rejects.toMatchObject({ status: 409, message: 'Incorrect password' });
    });

    it('should throw 404 when user not found', async () => {
        const hashedPassword = 'password';
        jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

        await expect(
            UserService.changeEmail('123', { password: hashedPassword, email: 'mock@email.com' })
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });
    });

    it('should throw if database error occurs', async () => {
        const hashedPassword = 'password';
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'findById').mockRejectedValue(dbError);

        await expect(
            UserService.changeEmail('123', { password: hashedPassword, email: 'mock@email.com' })
        ).rejects.toThrow('DB connection failed');
    });
});