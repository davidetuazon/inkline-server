const WorkspaceModel = require('../../../src/features/workspace/workspace.model');
const WorkspaceService = require('../../../src/features/workspace/workspace.service');

describe('Workspace service - findAll', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call paginate with correct base filter', async () => {
        WorkspaceModel.paginate = jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

        const userId = '123';
        await WorkspaceService.findAll(userId);

        expect(WorkspaceModel.paginate).toHaveBeenCalledWith(
            expect.objectContaining({
                deleted: false,
                $or: [
                    { owner: userId },
                    { 'members.user': userId }
                ]
            }),
            expect.any(Object)
        );
    });

    it('should add $text when query is provided', async () => {
        WorkspaceModel.paginate = jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

        const userId = '123';
        const query = 'project';

        await WorkspaceService.findAll(userId, query);

        expect(WorkspaceModel.paginate).toHaveBeenCalledWith(
            expect.objectContaining({
                $text: { $search: query }
            }),
            expect.any(Object)
        );
    });

    it('should use default pagination options', async () => {
        WorkspaceModel.paginate = jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

        await WorkspaceService.findAll('123');

        expect(WorkspaceModel.paginate).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                page: 1,
                limit: 8,
                sort: { createdDate: -1 },
                lean: true,
                populate: { path: 'owner', select: 'email username' }
            })
        );
    });

    it('should apply custom pagination options', async () => {
        WorkspaceModel.paginate = jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

        await WorkspaceService.findAll('123', '', { page: 2, limit: 5, sort: { name: 1 } });

        expect(WorkspaceModel.paginate).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                page: 2,
                limit: 5,
                sort: { name: 1 }
            })
        );
    });

    it('should return the paginate result', async () => {
        const mockResult = { docs: [{ name: 'Test' }], totalDocs: 1 };
        WorkspaceModel.paginate = jest.fn().mockResolvedValue(mockResult);

        const result = await WorkspaceService.findAll('123');

        expect(result).toEqual(mockResult);
    });
});