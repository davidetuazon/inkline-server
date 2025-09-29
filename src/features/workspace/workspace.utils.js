const UserModel = require('../user/user.model');

const workspaceOwnerValidator = async (userId, username) => {
    if (!userId || !username) throw { status: 400, message: 'Missing parameter/s' };

    const owner = await UserModel.findOne({ deleted: false, username: username });
    if (!owner) throw { status: 404, message: 'User not found' };

    if (userId.toString() !== owner._id.toString()) {
        throw { status: 401, message: 'Only the owner can update workspace details' };
    };

    return owner;
};

const slugify = (name) => {
    return name
        .trim()                              // remove leading/trailing spaces
        .toLowerCase()                       // lowercase
        .replace(/\s+/g, '-')                // spaces → dashes
        .normalize('NFD')                     // separate accents from letters
        .replace(/[\u0300-\u036f]/g, '')     // remove accent marks
        .replace(/[^a-z0-9\-]/g, '');        // remove invalid chars except dash
};

module.exports = {
    workspaceOwnerValidator,
    slugify,
}