'use strict'

var mongoose_paginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function prueba(req, res){
    res.status(200).send({message: 'Prueba del controlador de follows'});
}

function saveFollow(req, res){
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, storedFollow) =>{
        if(err) return res.status(500).send({message: 'Error al guardar el follow'});

        if(!storedFollow) return res.status(404).send({message: 'El follow no se ha guardado'});

        return res.status(200).send({follow: storedFollow});
    });
}

function deleteFollow(req, res){
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user': userId, 'followed': followId}).remove(err=>{
        if(err) return res.status(500).send({message: 'Error al eliminar el follow'});

        return res.status(200).send({message: 'El follow se ha eliminado'});
    });
}

function getFollowedUsers(req, res){
    var userId = req.user.sub;

    if(req.params.id){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({'user': userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!users) return res.status(404).send({message: 'No sigues a nadie'});

        return res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            users
        });
    });
}

function getFollowers(req, res){
    var userId = req.user.sub;

    if(req.params.id){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({'followed': userId}).populate({path: 'user'}).paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!users) return res.status(404).send({message: 'Nadie te sigue'});

        return res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            users
        });
    });
}

function getMyFollows(req, res){
    var userId = req.user.sub;

    var find = Follow.find({'user': userId});

    if(req.params.followed){
        find = Follow.find({'followed': userId});
    }

    find.populate('user followed').exec((err, follows) => {
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No sigues a nadie'});

        return res.status(200).send({
            follows
        });
    });
}

module.exports = {
    prueba,
    saveFollow,
    deleteFollow,
    getFollowedUsers,
    getFollowers,
    getMyFollows
}