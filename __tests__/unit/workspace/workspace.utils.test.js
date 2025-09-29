const UserModel = require('../../../src/features/user/user.model');
const { createMockUser } = require('../../helpers/user.helper');
const { workspaceOwnerValidator, slugify } = require('../../../src/features/workspace/workspace.utils');
const mongoose = require('mongoose');

describe('workspaceOwnerValidator', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    it('should throw 400 when missing parameter/s', async () => {
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

        await expect(
            workspaceOwnerValidator(null, null)
        ).rejects.toMatchObject({ status: 400, message: 'Missing parameter/s' });

        expect(UserModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw 404 when user not found', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

        await expect(
            workspaceOwnerValidator(mockUser._id, 'tester')
        ).rejects.toMatchObject({ status: 404, message: 'User not found' });

        expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, username: 'tester' });
    });

    it('should throw 401 when user is not the owner', async () => {
         const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
         jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser);

         await expect(
            workspaceOwnerValidator(new mongoose.Types.ObjectId(), mockUser.username)
         ).rejects.toMatchObject({ status: 401, message: 'Only the owner can update workspace details' });
         
         expect(UserModel.findOne).toHaveBeenCalledWith({ deleted: false, username: 'tester' });
    });

    it('should return owner when valid', async () => {
        const mockUser = createMockUser({ _id: new mongoose.Types.ObjectId() });
        jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser);

        const result = await workspaceOwnerValidator(mockUser._id, mockUser.username);

        expect(result).toEqual(mockUser);
    });
});

describe('slugify', () => {
    it('should convert spaces to dashes', () => {
        expect(slugify('My Workspace Name')).toBe('my-workspace-name');
    });

    it('should trim leading and trailing spaces', () => {
        expect(slugify('   hello world   ')).toBe('hello-world');
    });

    it('should remove special characters except dash', () => {
        expect(slugify('Hello@World!')).toBe('helloworld');
    });

    it('should normalize and remove accents', () => {
        expect(slugify('Café au Lait')).toBe('cafe-au-lait');
    });

    it('should handle multiple spaces', () => {
        expect(slugify('hello    world')).toBe('hello-world');
    });

    it('should lowercase everything', () => {
        expect(slugify('HELLO World')).toBe('hello-world');
    });

    it('should return empty string when input is only invalid chars', () => {
        expect(slugify('@@@###$$$')).toBe('');
    });
});