const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const PostSchema = new Schema({
    title: String,
    description: String,
    content: String,
    cover: String,
}, {
    timestamp: true,
});


const PostModel = model('Post', PostSchema);

module.exports = PostModel;
