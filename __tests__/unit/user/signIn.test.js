const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const { createMockUser } = require('../../helpers/user.helper');
const bcrypt = require('bcryptjs');

describe('User service - signIn', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when missing request body', async () => {
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

        await expect(
            UserService.signIn(null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing request body' });
        expect(UserModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw 404 when user not found', async () => {
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

        await expect(
            UserService.signIn({ email: 'frieren@zoltrak.com', password: 'raidenshogun' })
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });
        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, email: 'frieren@zoltrak.com' });
    });

    it('should throw 401 when incorrect password / email', async () => {
        const mockUser = createMockUser({});
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(
            UserService.signIn({ email: 'frieren@zoltrak.com', password: 'raidenshogun123' })
        ).rejects.toMatchObject({ status: 401, message: 'Incorrect email / password' });
        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, email: 'frieren@zoltrak.com' });
        expect(bcrypt.compare).toHaveBeenCalledWith('raidenshogun123', mockUser.password);
    });

    it('should return safe user fields when successful', async () => {
        const mockUser = createMockUser({ email: 'frieren@zoltrak.com', password: 'raidenshogun' });
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        
        const result = await UserService.signIn({ email: 'frieren@zoltrak.com', password: 'raidenshogun' });

        expect(result).toEqual({
            role: mockUser.role,
            email: mockUser.email,
            _id: mockUser._id,
            username: mockUser.username,
        });
        expect(result).not.toHaveProperty('password');
        expect(result).not.toHaveProperty('refreshToken');
        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, email: 'frieren@zoltrak.com' });
        expect(bcrypt.compare).toHaveBeenCalledWith('raidenshogun', mockUser.password);
    });
});