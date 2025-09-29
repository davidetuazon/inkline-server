const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
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