var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var User = new Schema({
    email               : String,
    verified            : Boolean,
    password            : String,

    minecraft           : ObjectId
});
mongoose.model('user', User);