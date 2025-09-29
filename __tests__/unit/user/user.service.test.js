const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const bcrypt = require('bcryptjs');
const { createMockUser, expectSafeUser } = require('../../helpers/user.helper');

describe('User service - updateProfile', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should update fullName', async () => {
        const mockUser = createMockUser({ fullName: 'John Doe' });

        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(mockUser);

        const result = await UserService.updateProfile('123', { fullName: 'John Doe' });

        expect(result.fullName).toEqual('John Doe');
        expectSafeUser(result, { fullName: 'John Doe' });
    });

    it('should ignore disallowed fields', async() => {
        const mockUser = createMockUser({});

        const spy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(mockUser);

        await UserService.updateProfile('123', { email: 'test@jest.com' });

        expect(spy).toHaveBeenCalledWith('123', {}, { new: true });
    });

    it('should thow 404 if user not found', async () => {
        jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(null);

        await expect(
            UserService.updateProfile('123', { fullName: 'John Doe' })
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });
    });

    it('should throw if database error occurs', async () => {
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'findByIdAndUpdate').mockRejectedValue(dbError);

        await expect(
            UserService.updateProfile('123', { fullName: 'John Doe' })
        ).rejects.toThrow('DB connection failed');
    })
});

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

describe('User service - DeleteAccount', () => {
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

describe('User service - ChangePassword', () => {
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