'use strict'

var express =  require('express');
var PostController = require('../controllers/post');
var md_auth = require('../middlewares/authenticate');

var api = express.Router();
var multiParty = require('connect-multiparty');

var md_upload = multiParty({uploadDir: './uploads/posts'});

api.get('/pruebita', md_auth.ensureAuth, PostController.probando);
api.post('/post', md_auth.ensureAuth, PostController.savePost);
api.get('/posts/:page?',md_auth.ensureAuth, PostController.getPosts);
api.get('/post/:id',md_auth.ensureAuth,PostController.getpost);
api.delete('/post/:id', md_auth.ensureAuth, PostController.deletePost);
api.post('/upload-post-image/:id', [md_auth.ensureAuth, md_upload], PostController.uploadImage);
api.get('/get-post-image/:imageFile', PostController.getImageFile);

module.exports = api;