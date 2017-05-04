var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var MinecraftUser = new Schema({
    name                    : String,
    name_lower              : String,
    uuid                    : String,

    initial_join_date       : Date,
    last_online_date        : Date,

    ranks                   : [String],
    ips                     : [String]
});
mongoose.model('minecraft_user', MinecraftUser);