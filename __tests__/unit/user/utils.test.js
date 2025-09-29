const { toSafeUser } = require('../../../src/features/user/user.utils');

describe('toSafeUser', () => {
    it('should strip sensitive fields before returning user', async () => {
        const userDoc = {
            _id: '123',
            username: 'testuser',
            fullName: 'Dev Test',
            email: 'devtest@email.com',
            password: 'secret',
            refreshToken: 'sensitive',
            toObject: function() {
                return { ...this };
            }
        };

        const safeUser = toSafeUser(userDoc);

        expect(safeUser).toEqual(expect.objectContaining({
            _id: '123',
            username: 'testuser',
            fullName: 'Dev Test',
            email: 'devtest@email.com',
        }));
        expect(safeUser).not.toHaveProperty('password');
        expect(safeUser).not.toHaveProperty('refreshToken');
        
    });
});