const request = require('supertest');
const app = require('../../../app');
const bcrypt = require('bcryptjs');
const UserService = require('../../../src/features/user/user.service');

const route = '/api/v1/user/register';
const mockUser = {
    username: 'kafka3zq',
    fullName: 'Dev Tester',
    email: 'mock@email.com',
    password: 'raidenshogun',
};

describe('POST /user/register', () => {
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

    it('should return 201 if registration is successful', async () => {
        jest.spyOn(UserService, 'createUser').mockResolvedValue({});
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        
        const res = await request(app)
            .post(route)
            .send(mockUser);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ success: true, message: 'Registration successful' });
        expect(bcrypt.hash).toHaveBeenCalledWith('raidenshogun', 16);
    });

    it('should return 409 if email is not unique', async () => {
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        jest.spyOn(UserService, 'createUser').mockRejectedValue({
            code: 11000,
            keyPattern: { email: 1 }
        });

        const res = await request(app)
            .post(route)
            .send(mockUser);

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'An account with this email already exists' });
    });

    it('should return 409 if username is not unique', async () => {
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        jest.spyOn(UserService, 'createUser').mockRejectedValue({
            code: 11000,
            keyPattern: { username: 1 },
            keyValue: { username: 'kafka3zq' },
        });

        const res = await request(app)
            .post(route)
            .send(mockUser);

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'Username "kafka3zq" is already taken' });
    });

    it('should return 500 on unexpected error', async () => {
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        jest.spyOn(UserService, 'createUser').mockRejectedValue(new Error('DB down'));

        const res = await request(app)
            .post(route)
            .send(mockUser);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
    });
});