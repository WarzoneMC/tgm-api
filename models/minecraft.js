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
MinecraftUser.methods.toJSON = function() {
    var obj = this.toObject();
    delete obj.password;
    delete obj.ips;
    return obj;
};
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

var MinecraftDeath = new Schema({
    player          : ObjectId,
    killer          : ObjectId,

    playerItem      : String,
    killerItem      : String,

    map             : ObjectId,

    date            : Date,

    playerLoaded    : MinecraftUser,
    killerLoaded    : MinecraftUser
});
mongoose.model('minecraft_death', MinecraftDeath);

var MinecraftMap = new Schema({
    name            : String,
    nameLower       : String,
    version         : String,
    authors         : [String],
    gametype        : String,
    thumbnail       : String,
    images          : [String],
    teams           : [{
        id: String,
        name: String,
        color: String,
        min: Number,
        max: Number,
    }]
});
mongoose.model('minecraft_map', MinecraftMap);

var MinecraftMatch = new Schema({
    map             : ObjectId,
    startedDate     : Date,
    finishedDate    : Date,
    chat            : [{
        user: ObjectId,
        username: String,
        uuid: String,
        message: String,
        team: String,
        matchTime: Number,
        teamChat: Boolean
    }],
    deaths: [ObjectId],
    winners: [ObjectId],
    losers: [ObjectId],
    winningTeam: String,
    teamMappings: [{
        team: String,
        player: ObjectId
    }]
});
mongoose.model('minecraft_match', MinecraftMatch);