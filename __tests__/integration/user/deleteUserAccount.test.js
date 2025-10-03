const UserService = require('../../../src/features/user/user.service');
const { setMockUser, req } = require('../../helpers/user.request.helper');

const method = 'DELETE';
const route = '/api/v1/settings/admin';

describe('DELETE /settings/admin', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 404 if user not found', async() => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'deleteAccount').mockRejectedValue({ status: 404, message: 'User not found' });
        
        const res = await req(method, route, token);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
        expect(UserService.deleteAccount).toHaveBeenCalledWith(mockUser._id);
    });

    it('should return 201 and deleted user if successful', async() => {
        const { mockUser, token } = setMockUser({ deleted: true });
        
        jest.spyOn(UserService, 'deleteAccount').mockResolvedValue(mockUser);

        const res = await req(method, route, token);

        expect(res.status).toBe(201);
        expect(res.body.user).toHaveProperty('deleted', true);
        expect(UserService.deleteAccount).toHaveBeenCalledWith(mockUser._id);
    });

    it('should return 500 on unexpected error', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'deleteAccount').mockRejectedValue(new Error('DB down'));

        const res = await req(method, route, token);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
        expect(UserService.deleteAccount).toHaveBeenCalledWith(mockUser._id);
    });
});