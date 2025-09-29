const express = require('express');
const router = express.Router();

const workspaceController = require('./workspace.controller');
const utils = require('../../shared/helpers/utils');

router.get('/home', utils.authenticate, workspaceController.listWorkspace);

router.post('/new', utils.authenticate, workspaceController.createWorkspace);

router.get('/:username/:slug', utils.authenticate, workspaceController.getWorkspace);

router.patch('/:username/:slug/details', utils.authenticate, workspaceController.updateWorkspaceName);

router.patch('/:username/:slug/admin', utils.authenticate, workspaceController.deleteWorkspace);

router.post('/:username/:slug/members/invite', utils.authenticate, workspaceController.sendWorkspaceInvite);

router.patch('/:username/:slug/members/invite/:inviteId', utils.authenticate, workspaceController.cancelWorkspaceInvite);

router.get('/invites', utils.authenticate, workspaceController.listWorkspaceInvite);

router.patch('/invites/:inviteId', utils.authenticate, workspaceController.handleWorkspaceInvite);

router.delete('/:username/:slug/members/me', utils.authenticate, workspaceController.leaveWorkspace);

router.delete('/:username/:slug/members/:memberId', utils.authenticate, workspaceController.removeWorkspaceMember);

module.exports = router;