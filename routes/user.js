'use strict'

var express = require('express');
var UserController = require('../controllers/user');
var md_auth = require('../middlewares/authenticate');
var multiParty = require('connect-multiparty');

var md_upload = multiParty({uploadDir: './uploads/users'});

var api = express.Router();

api.get('/home', UserController.home);
api.get('/pruebas', md_auth.ensureAuth, UserController.pruebas);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-user-image/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/get-user-image/:imageFile', UserController.getImageFile);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);

module.exports = api;