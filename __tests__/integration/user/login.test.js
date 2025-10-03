const request = require('supertest');
const app = require('../../../app');
const jwt = require('jsonwebtoken');
const UserService = require('../../../src/features/user/user.service');
const { createMockUser } = require('../../helpers/user.helper');

const route = '/api/v1/user/login';
const mockLogin = { email: 'mock@email.com', password: 'secret' };

describe('POST /user/login', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 422 if body is invalid', async () => {
        const res = await request(app)
            .post(route)
            .send({});

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ error: expect.anything() });
    });

    it('should return 404 if user not found', async () => {
        jest.spyOn(UserService, 'signIn').mockRejectedValue({ status: 404, message: 'User not found' });

        const res = await request(app)
            .post(route)
            .send(mockLogin);
        
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
    });

    it('should return 401 if password is incorrect', async () => {
        jest.spyOn(UserService, 'signIn').mockRejectedValue({ status: 401, message: 'Incorrect email / password' });

        const res = await request(app)
            .post(route)
            .send(mockLogin);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Incorrect email / password' });
    });

    it('should return 200 and access token when credentials are valid', async () => {
        const mockUser = createMockUser({});

        jest.spyOn(UserService, 'signIn').mockResolvedValue(mockUser);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');

        const res = await request(app)
            .post(route)
            .send(mockLogin);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({accessToken: 'fake-jwt-token' });
    });

    it('should return 500 on unexpected error', async () => {
        jest.spyOn(UserService, 'signIn').mockRejectedValue(new Error('DB down'));

        const res = await request(app)
            .post(route)
            .send(mockLogin);
        
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
    });
});