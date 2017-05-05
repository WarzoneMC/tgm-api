var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var MinecraftUser = new Schema({
    name                    : String,
    nameLower              : String,
    uuid                    : String,

    initialJoinDate       : Number,
    lastOnlineDate        : Number,

    ranks                   : [String],
    ips                     : [String],

    kills                   : Number,
    deaths                  : Number,
    wins                    : Number,
    losses                  : Number,
    matches                 : [ObjectId],
    ranks                   : [ObjectId]
});
mongoose.model('minecraft_user', MinecraftUser);

var MinecraftServer = new Schema({
    name               : String,
    nameLower         : String,
    id                 : String,

    lastOnlineDate        : Number,
    players            : [ObjectId],
    playerCount       : Number,
    spectatorCount    : Number,
    maxPlayers        : Number,
    map                : String,
    gametype           : String
});
mongoose.model('minecraft_server', MinecraftServer);

var MinecraftKill = new Schema({
    player          : ObjectId,
    target          : ObjectId,

    playerItem      : String,
    targetItem      : String,

    map             : ObjectId
});
mongoose.model('minecraft_kill', MinecraftKill);

var MinecraftMap = new Schema({
    name            : String,
    nameLower       : String,
    version         : String,
    authors         : [String],
    gametype        : String,
    thumbnail       : String,
    images          : [String],
    teams           : [{ id: String, name: String, color: String, min: Number, max: Number }]
});
mongoose.model('minecraft_map', MinecraftMap);