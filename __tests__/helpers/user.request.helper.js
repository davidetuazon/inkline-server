const app = require('../../app');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const UserModel = require('../../src/features/user/user.model');
const { createMockUser } = require('./user.helper');

const mockFindOneWithSelect = (resolvedValue) => {
    return jest.spyOn(UserModel, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(resolvedValue)
    });
};

process.env.ACCESS_TOKEN_SECRET = 'test-secret';
const mockJWTSign = (id) => jwt.sign({ _id: id }, 'test-secret');

const setMockUser = (overrides = {}) => {
    const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId(), ...overrides });
    mockFindOneWithSelect(mockUser);
    const token = mockJWTSign(mockUser._id);

    return { mockUser, token };
};

const req = (method, route, token, body) => {
    let baseReq = request(app)[method.toLowerCase()](route)
        .set('Authorization', `Bearer ${token}`);

    if(body !== undefined) baseReq = baseReq.send(body);
    return baseReq;
};

module.exports = {
    mockFindOneWithSelect,
    mockJWTSign,
    setMockUser,
    req,
}