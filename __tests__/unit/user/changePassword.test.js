const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const bcrypt = require('bcryptjs');
const { createMockUser, expectSafeUser } = require('../../helpers/user.helper');

describe('User service - changePassword', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should update password when old password matches', async () => {
        const hashedOldPassword = 'oldPassword';
        const hashedNewPasword = 'newPassword';

        const mockUser = createMockUser({ password: hashedOldPassword });

        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedNewPasword);

        const updatedUser = createMockUser({ password: hashedNewPasword });
        const spy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(updatedUser);

        const result = await UserService.changePassword('123', {
            oldPassword: 'secret',
            newPassword: 'raidenshogun'
        });

        expect(spy).toHaveBeenCalledWith('123', { password: hashedNewPasword }, { new: true });
        expect(result).not.toHaveProperty('password');
        expectSafeUser(result, { _id: '123' });
    });

    it('should throw 409 when old password does not match', async () => {
        const hashedOldPassword = 'oldPassword';

        const mockUser = createMockUser({ password: hashedOldPassword });
        
        jest.spyOn(UserModel, 'findById').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(
            UserService.changePassword('123', {
                oldPassword: 'kujiraireiko',
                newPassword: 'raidenshogun',
            })
        ).rejects.toMatchObject({ status: 409, message: 'Incorrect password' });
    });

    it('should throw 404 when user not found', async () => {
        jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

        await expect(
            UserService.changePassword('123', {
                oldPassword: 'kujiraireiko',
                newPassword: 'raidenshogun',
            })
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });
    });

    it('should throw if database error occurs', async () => {
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'findById').mockRejectedValue(dbError);

        await expect(
            UserService.changePassword('123', {
                oldPassword: 'kujiraireiko',
                newPassword: 'raidenshogun',
            })
        ).rejects.toThrow('DB connection failed');
    });
});