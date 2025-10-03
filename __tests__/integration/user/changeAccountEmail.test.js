const UserService = require('../../../src/features/user/user.service');
const { setMockUser, req } = require('../../helpers/user.request.helper');

const method = 'PATCH';
const route = '/api/v1/settings/security/email';

describe('PATCH /settings/security/email', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 422 if body is invalid', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changeEmail').mockResolvedValue(null);

        const res = await req(method, route, token, { email: 'frieren@zoltrak.com' });

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: expect.anything() });
        expect(UserService.changeEmail).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changeEmail').mockRejectedValue({ status: 404, message: 'User not found' });

        const res = await req(method, route, token, { email: 'frieren@zoltrak.com', password: 'raidenshogun' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
        expect(UserService.changeEmail).toHaveBeenCalledWith(
            mockUser._id,
            { email: 'frieren@zoltrak.com', password: 'raidenshogun' }
        );
    });

    it('should return 409 if password is incorrect', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changeEmail').mockRejectedValue({ status: 409, message: 'Incorrect password' });

        const res = await req(method, route, token, { email: 'frieren@zoltrak.com', password: 'raidenshogun' });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'Incorrect password' });
        expect(UserService.changeEmail).toHaveBeenCalledWith(
            mockUser._id,
            { email: 'frieren@zoltrak.com', password: 'raidenshogun' }
        );
    });

    it('should return 201 and updated + token if successful', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changeEmail').mockResolvedValue({ email: 'freiren@zoltrak.com' });

        const res = await req(method, route, token, { email: 'frieren@zoltrak.com', password: 'raidenshogun' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
            success: true,
            message: 'Email updated successfully',
            user: { email: 'freiren@zoltrak.com' },
            accessToken: expect.stringMatching(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
        });
        expect(UserService.changeEmail).toHaveBeenCalledWith(
            mockUser._id,
            { email: 'frieren@zoltrak.com', password: 'raidenshogun' }
        );
    });

    it('should return 409 if an account with the email already exists', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changeEmail').mockRejectedValue({
            code: 11000,
            keyPattern: { email: 1 },
            keyValue: { email: 'frieren@zoltrak.com' }
        });

        const res = await req(method, route, token, { email: 'frieren@zoltrak.com', password: 'raidenshogun' });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'An account with this email already exists' });
        expect(UserService.changeEmail).toHaveBeenCalledWith(
            mockUser._id,
            { email: 'frieren@zoltrak.com', password: 'raidenshogun' }
        );
    });

    it('should return 500 on unexpected error', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'changeEmail').mockRejectedValue(new Error('DB down'));

        const res = await req(method, route, token, { email: 'frieren@zoltrak.com', password: 'raidenshogun' });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
        expect(UserService.changeEmail).toHaveBeenCalledWith(
            mockUser._id,
            { email: 'frieren@zoltrak.com', password: 'raidenshogun' }
        );
    });
});