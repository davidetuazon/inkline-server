require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../../features/user/user.model');
const CONSTANTS = require('./constants');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);
    try {
        const userLogged = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = await UserModel.findOne({ deleted: false, _id: userLogged._id }).select(CONSTANTS.USER_FIELD);

        if (!req.user) return res.status(404).json({ error: 'User not found' });
        next();
    } catch (e) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = {
    authenticate,
}