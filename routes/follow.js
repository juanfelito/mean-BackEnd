'use strict'

var express =  require('express');
var FollowController = require('../controllers/follow');
var md_auth = require('../middlewares/authenticate');

var api = express.Router();

api.get('/prueba', md_auth.ensureAuth, FollowController.prueba);
api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
api.get('/followed/:page?/:id?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/followers/:page?/:id?', md_auth.ensureAuth, FollowController.getFollowers);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;