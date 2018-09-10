var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const User = new Schema({
    email               : String,
    verified            : Boolean,
    password            : String,

    minecraft           : ObjectId
});
export const UserModel = mongoose.model('user', User);