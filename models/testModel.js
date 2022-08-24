const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
user: {
type: mongoose.Schema.ObjectId,
ref: 'User',
required: [true, 'O grupo deve estar associado a um usuário'],
immutable: true,
},
folder: {
type: mongoose.Schema.ObjectId,
ref: 'Folder',
required: [true, 'O grupo deve estar associado a uma pasta'],
},
name: {
type: String,
maxlength: [40, 'O nome do grupo não deve ter mais de 40 caracteres'],
required: [true, 'O grupo deve possuir um nome'],
},
description: {
type: String,
maxlength: [
400,
'A descrição do conteúdo não deve ter mais de 200 caracteres',
],
},
createdAt: {
type: Date,
default: Date.now(),
immutable: true,
},
updatedAt: Date,
deletedAt: Date,
},
{
toObject: { virtuals: true },
toJSON: { virtuals: true },
},
);

groupSchema.virtual('files', {
ref: 'File',
localField: '_id',
foreignField: 'group'
})


const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
