const UserService = require('../../../src/features/user/user.service');
const { setMockUser, req } = require('../../helpers/user.request.helper');

const method = 'PATCH';
const route = '/api/v1/settings/profile';

describe('PATCH /settings/profile', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 422 if body is invalid', async () => {
        const { token } = setMockUser();

        jest.spyOn(UserService, 'updateProfile').mockResolvedValue(null);

        const res = await req(method, route, token);

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: expect.anything() });
        expect(UserService.updateProfile).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateProfile').mockRejectedValue({ status: 404, message: 'User not found' });

        const res = await req(method, route, token, { fullName: 'Frieren' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
        expect(UserService.updateProfile).toHaveBeenCalledWith(mockUser._id, { fullName: 'Frieren' });
    });

    it('should return 201 and updated user if successful', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateProfile').mockResolvedValue({ fullName: 'Sousou no Frieren' });

        const res = await req(method, route, token, { fullName: 'Sousou no Frieren' });
    
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ success: true, message: 'Full name updated successfully', user: { fullName: 'Sousou no Frieren' } });
        expect(UserService.updateProfile).toHaveBeenCalledWith(mockUser._id, { fullName: 'Sousou no Frieren' });
    });

    it('should return 500 on unexpected error', async () => {
        const { mockUser, token } = setMockUser();

        jest.spyOn(UserService, 'updateProfile').mockRejectedValue(new Error('DB down'));

        const res = await req(method, route, token, { fullName: 'Frieren' });
    
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down'});
        expect(UserService.updateProfile).toHaveBeenCalledWith(mockUser._id, { fullName: 'Frieren' });
    });
});