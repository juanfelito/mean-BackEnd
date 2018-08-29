'use strict'

var moment = require('moment');
var mongoose_paginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function pruebas(req, res){
    res.status(200).send({
        message: 'Hola desde los mensajes'
    });
}

function saveMessage(req, res){
    var params = req.body;

    if(params.text && params.receiver){
        var message = new Message();

        message.emmiter = req.user.sub;
        message.receiver = params.receiver;
        message.text = params.text;
        message.created_at = moment().unix();
        message.viewed = 'false';

        message.save((err, storedMessage) => {
            if(err) return res.status(500).send({message: 'Error en la petición'});

            if(!storedMessage) return res.status(404).send({message: 'Error al guardar el mensaje'});

            return res.status(200).send({storedMessage});
        });
    }else{
        return res.status(200).send({message: 'Faltan parámetros'});
    }
}

function getReceivedMessages(req, res){
    var user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({'receiver': user_id}).populate('emmiter', 'name surname _id nick image').paginate(page,itemsPerPage,(err, messages, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messages) return res.status(404).send({message: 'No hay mensajes'});

        return res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });

}

function getSentMessages(req, res){
    var user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({'emmiter': user_id}).populate('receiver', 'name surname _id nick image').paginate(page,itemsPerPage,(err, messages, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messages) return res.status(404).send({message: 'No hay mensajes'});

        return res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });

}

function getUnreadMessages(req, res){
    var user_id = req.user.sub;

    Message.count({'received': user_id,'viewed': 'false'}).exec((err, count) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        return res.status(200).send({unread: count});
    });
}

function setReadMessages(req, res){
    var user_id = req.user.sub;

    Message.update({'receiver': user_id,'viewed': 'false'},{'viewed':'true'},{'multi':true},(err,messageUpdated) =>{
        if(err) return res.status(500).send({message: 'Error en la petición'});

        return res.status(200).send({messages: messageUpdated});
    })
}

module.exports = {
    pruebas,
    saveMessage,
    getReceivedMessages,
    getSentMessages,
    getUnreadMessages,
    setReadMessages
}