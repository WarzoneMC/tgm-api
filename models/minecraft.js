let mongoose = require('mongoose');

let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var MinecraftPunishment = new Schema({
    punisher: ObjectId,
    punished: ObjectId,

    ip: String,
    ip_ban: Boolean, 

    type: String,
    
    issued: Number,
    expires: Number,
    reason: String,
    reverted: Boolean
});

MinecraftPunishment.methods.isActive = function() {
    if (this.reverted) {
        return false;
    } else {
        if (this.expires == -1) {
            return true;
        } else {
            return this.expires > new Date().getTime();
        }
    }
};

MinecraftPunishment.methods.toJSON = function() {
    var json = this.toObject();
    json.active = this.isActive();
    return json;
}

MinecraftPunishment.methods.shouldKick = function() {
    return this.type.toLowerCase() === 'ban' || this.type.toLowerCase() === 'kick';
};

MinecraftPunishment.methods.isTimed = function() {
    return this.type.toLowerCase() === 'ban' || this.type.toLowerCase() === 'mute';
};

MinecraftPunishment.methods.isBan = function() {
    return this.type.toLowerCase() === 'ban';
};

mongoose.model('minecraft_punishment', MinecraftPunishment);

var MinecraftUser = new Schema({
    name                    : String,
    nameLower               : String,
    uuid                    : String,

    initialJoinDate         : Number,
    lastOnlineDate          : Number,
    totalPlaytime           : Number,

    ranks                   : [ObjectId],
    ips                     : [String],

    tags                    : [String],
    activeTag               : String,

    kills                   : Number,
    deaths                  : Number,
    wins                    : Number,
    losses                  : Number,
    matches                 : Number,
    
    wool_destroys           : Number,
    wool_pickups            : Number,
    wool_placements         : Number,

    punishments             : [MinecraftPunishment]
});
function toJSON(obj, c) {
    if (c) obj = obj.toObject();
    delete obj.password;
    delete obj.ips;
    obj.level = parseInt(0.6 * Math.sqrt(((obj.wins ? obj.wins : 0) * 10) + ((obj.losses ? obj.losses : 0) * 5) + ((obj.wool_destroys ? obj.wool_destroys : 0) * 3) + ((obj.wool_pickups ? obj.wool_pickups : 0) * 3) + ((obj.wool_placements ? obj.wool_placements : 0) * 12) + ((obj.kills ? obj.kills : 0) * 2)), 10) + 1
    obj.levelRaw = 0.6 * Math.sqrt(((obj.wins ? obj.wins : 0) * 10) + ((obj.losses ? obj.losses : 0) * 5) + ((obj.wool_destroys ? obj.wool_destroys : 0) * 3) + ((obj.wool_pickups ? obj.wool_pickups : 0) * 3) + ((obj.wool_placements ? obj.wool_placements : 0) * 12) + ((obj.kills ? obj.kills : 0) * 2)) + 1
    obj.xp = ((obj.wins ? obj.wins : 0) * 10) + ((obj.losses ? obj.losses : 0) * 5) + ((obj.wool_destroys ? obj.wool_destroys : 0) * 3) + ((obj.wool_pickups ? obj.wool_pickups : 0) * 3) + ((obj.wool_placements ? obj.wool_placements : 0) * 12) + ((obj.kills ? obj.kills : 0) * 2);
    return obj;
}

MinecraftUser.statics.toJSON = toJSON;

MinecraftUser.methods.toJSON = function() {
    return toJSON(this, true);
}

MinecraftUser.methods.toFullJSON = function() {
    let obj = this.toObject();
    return obj;
};

MinecraftUser.methods.loadRanks = function (callback) {
    MinecraftRank.find({$or: [
        { _id: { $in: this.ranks } },
        { default: true }
    ]}, (err, ranks) => {
        if (err) console.log(err);
        
        callback(ranks);
    })
};
mongoose.model('minecraft_user', MinecraftUser);

let MinecraftRank = new Schema({
    name                : String,
    priority            : Number,
    prefix              : String,
    display             : String,
    permissions         : [String],
    staff               : Boolean,
    default             : Boolean
});
mongoose.model('minecraft_rank', MinecraftRank);

var MinecraftServer = new Schema({
    name                : String,
    motd                : String,
    nameLower           : String,
    id                  : String,

    lastOnline          : Number,
    players             : [ObjectId],
    playerNames         : [String],

    playerCount         : Number,
    spectatorCount      : Number,
    maxPlayers          : Number,
    map                 : String,
    gametype            : String
});
mongoose.model('minecraft_server', MinecraftServer);

let MinecraftDeath = new Schema({
    player          : ObjectId,
    killer          : ObjectId,

    playerItem      : String,
    killerItem      : String,

    map             : ObjectId,
    date            : Number,
    match           : ObjectId,

    playerLoaded    : MinecraftUser,
    killerLoaded    : MinecraftUser
});
mongoose.model('minecraft_death', MinecraftDeath);

let MinecraftMap = new Schema({
    name            : String,
    nameLower       : String,
    version         : String,
    authors         : [{
        uuid: String,
        username: String
    }],
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

let MinecraftMatch = new Schema({
    map             : ObjectId,
    initializedDate : Number,
    startedDate     : Number,
    finishedDate    : Number,
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
    }],
    finished: Boolean
});
mongoose.model('minecraft_match', MinecraftMatch);