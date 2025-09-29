const request = require('supertest');
const app = require('../../app');
const UserService = require('../../src/features/user/user.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createMockUser } = require('../helpers/user.helper');

describe('POST /user/login', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return access token when credentials are valid', async () => {
        const mockUser = createMockUser({});

        jest.spyOn(UserService, 'signIn').mockResolvedValue(mockUser);
        jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt-token');

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'mock@email.com', password: 'raidenshogun' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({accessToken: 'fake-jwt-token' });
    });

    it('should return 422 if body is invalid', async () => {
        const res = await request(app)
            .post('/api/v1/user/login')
            .send({});

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 404 if user not found', async () => {
        jest.spyOn(UserService, 'signIn').mockRejectedValue({ status: 404, message: 'User not found' });

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'mock@email.com', password: 'secret' });
        
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
    });

    it('should return 400 if password is incorrect', async () => {
        jest.spyOn(UserService, 'signIn').mockRejectedValue({ status: 400, message: 'Incorrect email / password' });

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'mock@email.com', password: 'secretz' });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Incorrect email / password' });
    });

    it('should return 500 on unexpected error', async () => {
        jest.spyOn(UserService, 'signIn').mockRejectedValue(new Error('DB down'));

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'mock@email.com', password: 'secret' });
        
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
    });
});

describe('POST /user/register', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 201 if registration is successful', async () => {
        jest.spyOn(UserService, 'create').mockResolvedValue({});
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        
        const res = await request(app)
            .post('/api/v1/user/register')
            .send({
                username: 'kafka3zq',
                fullName: 'Dev Tester',
                email: 'mock@email.com',
                password: 'raidenshogun',
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ success: true, message: 'Registration successful' });
        expect(bcrypt.hash).toHaveBeenCalledWith('raidenshogun', 16);
    });

    it('should return 422 if body is invalid', async () => {
        const res = await request(app)
            .post('/api/v1/user/register')
            .send({});

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 409 if email is not unique', async () => {
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        jest.spyOn(UserService, 'create').mockRejectedValue({
            code: 11000,
            keyPattern: { email: 1 }
        });

        const res = await request(app)
            .post('/api/v1/user/register')
            .send({
                username: 'kafka3zq',
                fullName: 'Dev Tester',
                email: 'mock@email.com',
                password: 'raidenshogun',
            });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'An account with this email already exists' });
    });

    it('should return 409 if username is not unique', async () => {
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        jest.spyOn(UserService, 'create').mockRejectedValue({
            code: 11000,
            keyPattern: { username: 1 },
            keyValue: { username: 'kafka3zq' },
        });

        const res = await request(app)
            .post('/api/v1/user/register')
            .send({
                username: 'kafka3zq',
                fullName: 'Dev Tester',
                email: 'mock@email.com',
                password: 'raidenshogun',
            });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: `Username "kafka3zq" is already taken` });
    });

    it('should return 500 on unexpected error', async () => {
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('raidenshogun');
        jest.spyOn(UserService, 'create').mockRejectedValue(new Error('DB down'));

        const res = await request(app)
            .post('/api/v1/user/register')
            .send({
                username: 'kafka3zq',
                fullName: 'Dev Tester',
                email: 'mock@email.com',
                password: 'raidenshogun',
            });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'DB down' });
    });
});