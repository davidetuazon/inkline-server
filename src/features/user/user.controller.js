require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validate = require('validate.js');
const constraints = require('./user.validation');
const UserService = require('./user.service');

exports.register = async (req, res, next) => {
    const params = {...req.body};
    const issues = validate(params, constraints.register);
    if (issues) return res.status(422).send({ error: issues });

    try {
        const fullName = params.fullName.trim().split(' ');
        params.firstName = fullName[0];
        params.lastName = fullName[fullName.length - 1];

        params.password = await bcrypt.hash(params.password, 16);
        await UserService.createUser(params);

        res.status(201).json({ success: true, message: 'Registration successful' });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        if (e.code === 11000 && e.keyPattern?.email) {
            return res.status(409).json({ error: `An account with this email already exists` });
        }
        if (e.code === 11000 && e.keyPattern?.username) {
            return res.status(409).json({ error: `Username "${e.keyValue.username}" is already taken` });
        }
        res.status(500).json({ error: e.message });
    }
}

exports.login = async (req, res, next) => {
    const params = {...req.body};
    const issues = validate(params, constraints.signIn);
    if (issues) return res.status(422).json({ error: issues });

    try {
        const user = await UserService.signIn(params);

        const payload = {
            role: user.role,
            email: user.email,
            _id: user._id,
            username: user.username,
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        res.send({ accessToken });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        return res.status(500).json({ error: e.message });
    }
}

exports.updatePublicProfile = async (req, res, next) => {
    const params = {...req.body};

    const issues = validate(params, constraints.profileUpdate);
    if (issues) return res.status(422).json({ error: issues });

    try {
        const updatedUser = await UserService.updateProfile(req.user._id, params);

        res.status(201).json({ success: true, message: 'Full name updated successfully', user: updatedUser });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        return res.status(500).json({ error: e.message });
    }
}

exports.updateAccountSettings = async (req, res, next) => {
    const params = {...req.body};

    const issues = validate(params, constraints.accountUpdate);
    if (issues) return res.status(422).json({ error: issues });

    try {
        const updatedUser = await UserService.updateAccount(req.user._id, params);

        const payload = {
            role: updatedUser.role,
            email: updatedUser.email,
            _id: updatedUser._id,
            username: updatedUser.username
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        res.status(201).json({ success: true, message: 'Username updated successfully', user: updatedUser, accessToken });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        if (e.code === 11000 && e.keyPattern?.username) {
            return res.status(409).json({ error: `Username "${e.keyValue.username}" is already taken` });
        }
        return res.status(500).json({ error: e.message });
    }
}

exports.deleteUserAccount = async (req, res, next) => {
    try {
        const deletedUser = await UserService.deleteAccount(req.user._id);

        res.status(201).json({ success: true, message: 'Account deleted successfully', user: deletedUser });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        return res.status(500).json({ error: e.message });
    }
}

exports.changeAccountPassword = async (req, res, next) => {
    const params = {...req.body};

    const issues = validate(params, constraints.passwordChange);
    if (issues) return res.status(422).json({ error: issues });

    if (params.oldPassword === params.newPassword) return res.status(409).json({ error: 'New password must be different from current password' });

    try {
        const updatedUser = await UserService.changePassword(req.user._id, params);

        res.status(201).json({ success: true, message: 'Password updated successfully', user: updatedUser });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        return res.status(500).json({ error: e.message });
    }
}

exports.changeAccountEmail = async (req, res, next) => {
    const params = {...req.body};

    const issues = validate(params, constraints.emailChange);
    if (issues) return res.status(422).json({ error: issues });

    try {
        const updatedUser = await UserService.changeEmail(req.user._id, params);

        const payload = {
            role: updatedUser.role,
            email: updatedUser.email,
            _id: updatedUser._id,
            username: updatedUser.username
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        res.status(201).json({ success: true, message: 'Email updated successfully', user: updatedUser, accessToken });
    } catch (e) {
        if (e.status) return res.status(e.status).json({ error: e.message });
        if (e.code === 11000 && e.keyPattern?.email) {
            return res.status(409).json({ error: `An account with this email already exists` });
        }
        return res.status(500).json({ error: e.message });
    }
}