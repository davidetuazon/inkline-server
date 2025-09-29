const UserModel = require('./user.model');
const bcrypt = require('bcryptjs');
const { toSafeUser } = require('./user.utils');
const { allowedUpdates } = require('../../shared/helpers/service.utils');

exports.create = async (params) => {
    if (!params) throw { status: 400, message: 'Missing request body' };

    try {
        await UserModel.create(params);
    } catch (e) {
        throw(e);
    }
}

exports.signIn = async (params) => {
    if (!params) throw { status: 400, message: 'Missing request body' };

    try {
        const user = await UserModel.findOne({
            deleted: false,
            email: params.email,
        })
        if (!user) throw { status: 404, message: 'User not found' };

        const matched = await bcrypt.compare(params.password, user.password);
        if (!matched) throw { status: 422, message: 'Incorrect email / password' };

        return {
            role: user.role,
            email: user.email,
            _id: user._id,
            username: user.username,
        }
    } catch (e) {
        throw(e);
    }
}

exports.updateProfile = async (userId, updates) => {
    const safeUpdates = allowedUpdates(['fullName'], updates);

    try {
        if (safeUpdates.fullName) {
            const fullName = safeUpdates.fullName.split(' ');
            safeUpdates.firstName = fullName[0];
            safeUpdates.lastName = fullName[fullName.length - 1];
        }

        const user = await UserModel.findByIdAndUpdate(userId, safeUpdates, { new: true });
        if (!user) throw { status: 404, message: 'User not found' };

        return toSafeUser(user);
    } catch (e) {
        throw(e);
    }
}

exports.updateAccount = async (userId, updates) => {
    const safeUpdates = allowedUpdates(['username'], updates);

    try {
        const user = await UserModel.findByIdAndUpdate(userId, safeUpdates, { new: true });
        if (!user) throw { status: 404, message: 'User not found' };
        
        return toSafeUser(user);
    } catch (e) {
        throw (e);
    }
}

exports.deleteAccount = async (userId) => {
    try {
        const user = await UserModel.findByIdAndUpdate(userId, { deleted: true }, { new: true });
        if (!user) throw { status: 404, message: 'User not found' };

        return toSafeUser(user);
    } catch (e) {
        throw(e);
    }
}

exports.changePassword = async (userId, updates) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) throw { status: 404, message: 'User not found' };

        const isMatched = await bcrypt.compare(updates.oldPassword, user.password);
        if (!isMatched) throw { status: 409, message: 'Incorrect password' };

        const hashed = await bcrypt.hash(updates.newPassword, 16);
        const updatedUser = await UserModel.findByIdAndUpdate(userId, { password: hashed }, { new: true });
        if (!updatedUser) throw { status: 404, message: 'User not found' };

        return toSafeUser(updatedUser);
    } catch (e) {
        throw(e);
    }
}

exports.changeEmail = async (userId, updates) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) throw { status: 404, message: 'User not found' };

        const isMatched = await bcrypt.compare(updates.password, user.password);
        if (!isMatched) throw { status: 409, message: 'Incorrect password' };

        const updatedUser = await UserModel.findByIdAndUpdate(userId, { email: updates.email }, { new: true });
        if (!updatedUser) throw { status: 404, message: 'User not found' };

        return toSafeUser(updatedUser);
    } catch (e) {
        throw(e);
    }
}

exports.getUser = async (userId, username) => {
    if (!username) throw { status: 400, message: 'Missing parameter/s' };

    try {
        const me = await UserModel.findOne({ deleted: false, _id: userId });
        if (!me) throw { status: 401, message: 'Unauthorized' };

        const user = await UserModel.findOne({ deleted: false, username: username});
        if (!user) throw { status: 404, message: 'User not found' };

        return toSafeUser(user);
    } catch (e) {
        throw(e);
    }
}