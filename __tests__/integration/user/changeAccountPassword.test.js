const UserService = require('../../../src/features/user/user.service');
const { setMockUser, req } = require('../../helpers/user.request.helper');

const method = 'PATCH';
const route = '/api/v1/settings/security/password';

describe('PATCH /settings/security/password', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 422 if body is invalid', async () => {
        const { token } = setMockUser();

        jest.spyOn(UserService, 'changePassword').mockResolvedValue(null);

        const res = await req(method, route, token, { password: 'raidenshogun' });
    
        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: expect.anything() });
        expect(UserService.changePassword).not.toHaveBeenCalled();
    });

    it('should return 409 if new password matches old password', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changePassword').mockResolvedValue(mockUser);

        const res = await req(method, route, token, { oldPassword: 'raidenshogun', newPassword: 'raidenshogun' });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'New password must be different from current password' });
        expect(UserService.changePassword).not.toHaveBeenCalled();
    });

    it('should return 409 if old password is incorrect', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changePassword').mockRejectedValue({ status: 409, message: 'Incorrect password' });

        const res = await req(method, route, token, { oldPassword: 'raidenshogun123', newPassword: 'sousounofrieren' });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'Incorrect password' });
        expect(UserService.changePassword).toHaveBeenCalledWith(
            mockUser._id,
            { oldPassword: 'raidenshogun123', newPassword: 'sousounofrieren' }
        );
    });

    it('should return 404 if user not found', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changePassword').mockRejectedValue({ status: 404, message: 'User not found' });

        const res = await req(method, route, token, { oldPassword: 'raidenshogun', newPassword: 'sousounofrieren' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
        expect(UserService.changePassword).toHaveBeenCalledWith(
            mockUser._id,
            { oldPassword: 'raidenshogun', newPassword: 'sousounofrieren' }
        );
    });

    it('should return 201 and updated user with safe fields if successful', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changePassword').mockResolvedValue(mockUser.toObject());

        const res = await req(method, route, token, { oldPassword: 'raidenshogun', newPassword: 'sousounofrieren' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ success: true, message: 'Password updated successfully', user: expect.anything(Object) });
        expect(res.body.user).not.toHaveProperty('password');
        expect(res.body.user).not.toHaveProperty('refreshToken');
        expect(UserService.changePassword).toHaveBeenCalledWith(
            mockUser._id,
            { oldPassword: 'raidenshogun', newPassword: 'sousounofrieren' }
        );
    });

    it('should return 500 on unexpected error', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changePassword').mockRejectedValue(new Error('DB down'));

        const res = await req(method, route, token, { oldPassword: 'raidenshogun', newPassword: 'sousounofrieren' });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down'});
        expect(UserService.changePassword).toHaveBeenCalledWith(
            mockUser._id,
            { oldPassword: 'raidenshogun', newPassword: 'sousounofrieren' }
        );
    });
});