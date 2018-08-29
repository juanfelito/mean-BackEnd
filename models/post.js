'use strict'

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var PostSchema = schema({
    user: {type: schema.ObjectId, ref: 'User'},
    text: String,
    file: String,
    created_at: String
});

module.exports = mongoose.model('Post',PostSchema);