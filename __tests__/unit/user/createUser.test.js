const UserService = require('../../../src/features/user/user.service');
const UserModel = require('../../../src/features/user/user.model');
const { createMockUser } = require('../../helpers/user.helper');

describe('User service - createUser', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw 400 when missing request body', async () => {
        jest.spyOn(UserModel, 'create').mockResolvedValue(null);

        await expect(
            UserService.createUser(null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing request body' });
        expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should create a new user', async () => {
        const mockUser = createMockUser({});

        jest.spyOn(UserModel, 'create').mockResolvedValue(mockUser);

        await UserService.createUser({
            fullName: 'Dev Test',
            username: 'tester',
            email: 'test@email.com',
            password: 'raidenshogun',
        });

        expect(UserModel.create).toHaveBeenCalledWith({
            fullName: 'Dev Test',
            username: 'tester',
            email: 'test@email.com',
            password: 'raidenshogun',
        });
    });

    it('should throw if database error occurs', async () => {
        const dbError = new Error('DB connection failed');

        jest.spyOn(UserModel, 'create').mockRejectedValue(dbError);

        await expect(
            UserService.createUser({
                fullName: 'Dev Test',
                username: 'tester',
                email: 'test@email.com',
                password: 'raidenshogun',
            })
        ).rejects.toThrow('DB connection failed');
    });
});