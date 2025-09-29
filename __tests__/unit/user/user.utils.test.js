const { toSafeUser } = require('../../../src/features/user/user.utils');
const { createMockUser } = require('../../helpers/user.helper');

describe('toSafeUser', () => {
    it('should strip sensitive fields before returning user', async () => {
        const baseUser = createMockUser({});
        const safeUser = toSafeUser(baseUser);

        expect(safeUser).toEqual(expect.objectContaining({
            _id: expect.anything(),
            username: 'tester',
            fullName: 'Dev Test',
            email: 'test@email.com',
        }));
        expect(safeUser).not.toHaveProperty('password');
        expect(safeUser).not.toHaveProperty('refreshToken');
        
    });
});