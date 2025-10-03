const UserService = require('../../../src/features/user/user.service');
const { setMockUser, req } = require('../../helpers/user.request.helper');

const method = 'PATCH';
const route = '/api/v1/settings/admin';

describe('PATCH /settings/admin', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 422 if body is invalid', async () => {
        const { token } = setMockUser();

        jest.spyOn(UserService, 'updateAccount').mockResolvedValue(null);

        const res = await req(method, route, token, { username: 'fern' });

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: expect.anything() });
        expect(UserService.updateAccount).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateAccount').mockRejectedValue({ status: 404, message: 'User not found' });

        const res = await req(method, route, token, { username: 'frieren' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
        expect(UserService.updateAccount).toHaveBeenCalledWith(mockUser._id, { username: 'frieren' });
    });

    it('should return 201 and updated user + new token if successful', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateAccount').mockResolvedValue({ username: 'frieren' });

        const res = await req(method, route, token, { username: 'frieren' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
            success: true,
            message: 'Username updated successfully',
            user: { username: 'frieren' },
            accessToken: expect.stringMatching(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/),
        });
        expect(UserService.updateAccount).toHaveBeenCalledWith(mockUser._id, { username: 'frieren' });
    });

    it('should return 409 if username already taken', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateAccount').mockRejectedValue({
            code: 11000,
            keyPattern: { username: 1 },
            keyValue: { username: 'frieren' },
        });

        const res = await req(method, route, token, { username: 'frieren' });
       
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'Username "frieren" is already taken' });
        expect(UserService.updateAccount).toHaveBeenCalledWith(mockUser._id, { username: 'frieren' });
    });

    it('should return 500 on unexpected error', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateAccount').mockRejectedValue(new Error('DB down'));

        const res = await req(method, route, token, { username: 'frieren' });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
        expect(UserService.updateAccount).toHaveBeenCalledWith(mockUser._id, { username: 'frieren' });
    });
});