'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var md_auth = require('../middlewares/authenticate');

var api = express.Router();

api.get('/pruebame', MessageController.pruebas);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getSentMessages);
api.get('/unread-messages',md_auth.ensureAuth, MessageController.getUnreadMessages);
api.get('/set-viewed',md_auth.ensureAuth, MessageController.setReadMessages);

module.exports = api;