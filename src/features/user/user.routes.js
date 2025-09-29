const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const utils = require('../../shared/helpers/utils');

router.post('/user/register', userController.register);

router.post('/user/login', userController.login);

router.patch('/settings/profile', utils.authenticate, userController.updatePublicProfile);

router.patch('/settings/admin', utils.authenticate, userController.updateAccountSettings);

router.delete('/settings/admin', utils.authenticate, userController.deleteUserAccount);

router.patch('/settings/security/password', utils.authenticate, userController.changeAccountPassword);

router.patch('/settings/security/email', utils.authenticate, userController.changeAccountEmail);

router.get('/me', utils.authenticate, async (req, res, next) => {
    try {
        res.send(req.user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    };
});

module.exports = router;