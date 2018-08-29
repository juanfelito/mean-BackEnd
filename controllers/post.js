'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Post = require('../models/post');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res){
    return res.status(200).send({
        message: 'Prueba del controlador de Posts'
    });
}

function savePost(req, res){
    var params = req.body;
    
    if(!params.text){
        return res.status(200).send({message: 'Debes enviar un texto'});
    }
    
    var post = new Post();

    post.text = params.text;
    post.file = null;
    post.user = req.user.sub;
    post.created_at = moment().unix();

    post.save((err, savedPost) => {
        if(err) return res.status(500).send({message: 'Error al guardar la publicación'});

        if(!savedPost) return res.status(404).send({message: 'La publicación no ha sido guardada'});

        return res.status(200).send({
            post: savedPost
        });
    });
}

function getpost(req, res){
    var post_id = req.params.id;

    Post.findById(post_id, (err, post) => {
        if(err) return res.status(500).send({message: 'Error al devolver el post'});

        if(!post) return res.status(404).send({message: 'No existe la publicaci?n'});

        return res.status(200).send({post});
    });
}

function getPosts(req, res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({'user': req.user.sub}).populate('followed').exec((err, follows) => {
        if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});

        var follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        
        follows_clean.push(req.user.sub);
        
        Post.find({'user': {$in: follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPerPage,(err, posts, total) => {
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if(!posts) return res.status(404).send({message: 'No ha publicaciones'});

            return res.status(200).send({
                totalItems: total,
                pages: Math.ceil(total/itemsPerPage),
                page: page,
                itemsPerPage: itemsPerPage,
                posts
            });
        });
    });    
}

//No puede borrar el que no es due?o, pero no da mensaje correcto
function deletePost(req, res){
    var post_id = req.params.id;

    Post.find({'user': req.user.sub, '_id': post_id}).remove(err => {
        if(err) return res.status(500).send({message: 'Error al borrar publicaci?n'});

        return res.status(200).send({
            message: 'Publicaci?n removida con ?xito'
        });
    });
}

function uploadImage(req, res){
    var post_id = req.params.id;

    
    if(req.files){
        
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(file_ext === 'png' || file_ext === 'jpg' || file_ext === 'jpeg' || file_ext === 'gif'){

            Post.findOne({'user': req.user.sub, '_id':post_id}).exec((err, post) => {
                if(post){
                    Post.findByIdAndUpdate(post_id, {file:file_name}, {new:true}, (err, updatedPost) => {
                        if(err) return res.status(500).send({message: 'Error en la petición'});
        
                        if(!updatedPost) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
        
                        return res.status(200).send({
                            post: updatedPost
                        });
                    });
                }else{
                    return deleteUploadedImages(res, file_path, 'No tienes permiso para modificar el post');
                }
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

    var filePath = './uploads/posts/' + imageFile;

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
    probando,
    savePost,
    getPosts,
    getpost,
    deletePost,
    uploadImage,
    getImageFile
}