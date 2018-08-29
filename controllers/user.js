'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoose_paginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Follow = require('../models/follow');
var Post = require('../models/post');
var jwt = require('../services/jwt');


function home(req, res){
    res.status(200).send({
        message: 'Hola mundo'
    });
}

function pruebas(req, res){
    res.status(200).send({
        message: 'pruebas',
        user: req.user
    });
}

function saveUser(req, res){
    var params = req.body;
    var user = new User();

    if( params.name && params.surname && 
        params.nick && params.email && params.password){
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;

            User.find({$or: [{email: user.email.toLowerCase()},{nick: user.nick.toLowerCase()}]}).exec((err, users) =>{
                if(err) return res.status(500).send({message: 'Error al guardar el usuario'});

                if(users && users.length > 0){
                    return res.status(200).send({
                        message: 'Usuario ya existe'
                    });
                } else{
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;
                        user.save((err, userStored) =>{
                            if(err) return res.status(500).send({message: 'Error al guardar el usuario'});
                            if(userStored){
                                res.status(200).send({
                                    user: userStored
                                });
                            }else{
                                res.status(404).send({
                                    message: 'No se ha registrado el usuario'
                                });
                            }
                        });
                    });
                }
            });            
    }else{
        res.status(200).send({
            message: 'Hacen falta datos!'
        });
    }
}

function loginUser(req, res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(user){
            bcrypt.compare(password, user.password, (err, check) =>{
                if(err) return res.status(500).send({message: 'Error en la petición'});

                if(check){
                    if(params.getToken){
                        return res.status(200).send({
                            token:jwt.createToken(user)
                        });
                    }
                    else{
                        user.password = undefined;
                        return res.status(200).send({
                            user
                        });
                    }
                }
                else{
                    return res.status(404).send({
                        message: 'Contraseña incorrecta'
                    });
                }
            });
        }else{
            return res.status(404).send({
                message: 'No existe el usuario!'
            });
        }
    });
}

function getUser(req, res){
    var user_id = req.params.id;
    User.findById(user_id,(err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!user) return res.status(404).send({message: 'No se encontró el usuario'});

        user.password = undefined;
        doWeFollowEachother(req.user.sub, user_id).then((value) => {
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        })     
        
    });
}

async function doWeFollowEachother(myId, otherUserId){
    try{
        var following = await Follow.findOne({'user':myId,'followed': otherUserId}).exec()
            .then((follow) => {
                return follow;
            })
            .catch((err) => {
                return handleError(err);
            });
    
        var followed = await Follow.findOne({'user':otherUserId,'followed': myId}).exec()
            .then((follow) => {
                return follow;
            })
            .catch((err) => {
                return handleError(err);
            });
    
        return {
            following: following, 
            followed: followed
            }
    }
    catch(e){
        console.log(e);
    }
}

function getUsers(req, res){
    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemPerPage = 5;

    User.find().sort('_id').paginate(page, itemPerPage, (err, users, total) =>{
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!users) return res.status(404).send({message: 'No se encontraron usuarios'});

        followUsersId(identity_user_id).then((value) => {
            return res.status(200).send({
                users,
                total,
                pages: Math.ceil(total/itemPerPage),
                following: value.following,
                followsMe: value.followed
            });
        });
    });
}

async function followUsersId(user_id){
    try{
        var following = await Follow.find({'user': user_id}).select({'_id':0,'_v':0,'user':0}).exec()
            .then((follows) => {
                var follows_clean = [];
                follows.forEach((follow) => {
                    follows_clean.push(follow.followed);
                });
                return follows_clean;
            })
            .catch((err) => {
                return handleError(err);
            });
        
        var followed = await Follow.find({'followed': user_id}).select({'_id':0,'_v':0,'followed':0}).exec()
            .then((follows) => {
                var follows_clean = [];
                follows.forEach((follow) => {
                    follows_clean.push(follow.user);
                });
                return follows_clean;
            })
            .catch((err) => {
                return handleError(err);
            });
        
        return {
            following: following, 
            followed: followed
            }

    }catch(e){
        console.log(e);
    }
}

function getCounters(req, res){
    if(req.params.id){
        var user_id = req.params.id;
    }
    else{
        var user_id = req.user.sub;
    }
    
    followCounter(user_id).then((value) => {
        return res.status(200).send({
            following: value.following,
            followedBy: value.followesMe,
            posts: value.posts
        });
    });
}

async function followCounter(user_id){
    try{
        var posts = await Post.count({'user': user_id}).exec()
            .then((postsNumber) => {
                return postsNumber;
            })
            .catch((err) => {
                return handleError(err);
            });
        var following = await Follow.count({'user': user_id}).exec()
            .then((follows) => {
                return follows;
            })
            .catch((err) => {
                return handleError(err);
            });
        
        var followesMe = await Follow.count({'followed': user_id}).exec()
            .then((follows) => {                
                return follows;
            })
            .catch((err) => {
                return handleError(err);
            });
        
        return {
            following: following, 
            followesMe: followesMe,
            posts: posts
        }

    }catch(e){
        console.log(e);
    }
}

function updateUser(req, res){
    var user_id = req.params.id;
    var update = req.body;

    delete update.password;

    if(user_id != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
    }

    User.find({$or: [{email: update.email.toLowerCase()},{nick: update.nick.toLowerCase()}]}).exec((err, users) => {
        var userIsset = false;
        users.forEach((user) => {
            if(user && user_id != user._id) {
                userIsset = true;
            }
        });

        if (userIsset) {
            return res.status(500).send({message: 'Los datos ya están en uso'});
        }

        User.findByIdAndUpdate(user_id, update, {new: true}, (err, updatedUser) =>{
            if(err) return res.status(500).send({message: 'Error en la petición'});
    
            if(!updatedUser) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
    
            return res.status(200).send({
                user: updatedUser
            });
        });
    });
}

function uploadImage(req, res){
    var user_id = req.params.id;

    
    if(req.files){
        
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        
        if(user_id != req.user.sub){
            return deleteUploadedImages(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
        }

        if(file_ext === 'png' || file_ext === 'jpg' || file_ext === 'jpeg' || file_ext === 'gif'){
            User.findByIdAndUpdate(user_id, {image:file_name}, {new:true}, (err, updatedUser) => {
                if(err) return res.status(500).send({message: 'Error en la petición'});

                if(!updatedUser) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

                return res.status(200).send({
                    user: updatedUser
                });
            });
        }
        else{
            return deleteUploadedImages(res, file_path, 'Extensión no válida');
        }
    }
    else{
        return res.status(200).send({
            message: 'No se ha subido una imagen'
        });
    }
}

function deleteUploadedImages(res, file_path, message){
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({message});
    });
}

function getImageFile(req, res){
    var imageFile = req.params.imageFile;

    var filePath = './uploads/users/' + imageFile;

    fs.exists(filePath,(exists) => {
        if(exists){
            res.sendFile(path.resolve(filePath));
        }
        else{
            res.status(200).send({message: 'No existe la imagen'});
        }
    });
}

module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile,
    getCounters
}