const createMockUser = (overrides = {}) => {
    const baseUser = {
        _id: '123',
        role: 'default',
        fullName: 'Dev Test',
        username: 'tester',
        email: 'test@email.com',
        deleted: false,
        refreshToken: ['sensitive'],
        password: 'raidenshogun',
    }
    const user = {...baseUser, ...overrides};
    return {
        ...user,
        toObject: function() {
            const { password, ...safe } = this;
            return { ...safe };
        }
    };
};

const expectSafeUser = (user, expected = {}) => {
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('refreshToken');
    expect(user).toEqual(expect.objectContaining(expected));
}

module.exports = {
    createMockUser,
    expectSafeUser
}