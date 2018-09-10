let mongoose = require('mongoose');

let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const MinecraftPunishment = new Schema({
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

MinecraftPunishment.methods.isBan = function() {
    return this.type.toLowerCase() === 'ban';
};

export const MinecraftPunishmentModel = mongoose.model('minecraft_punishment', MinecraftPunishment);

const MinecraftUser = new Schema({
    name                    : String,
    nameLower               : String,
    uuid: {
        type: String,
        index: true
    },

    initialJoinDate         : Number,
    lastOnlineDate          : Number,

    ranks                   : [ObjectId],
    ips                     : [String],

    kills                   : Number,
    deaths                  : Number,
    wins                    : Number,
    losses                  : Number,
    
    wool_destroys           : Number,
    punishments             : [MinecraftPunishment]
});
MinecraftUser.methods.toJSON = function() {
    let obj = this.toObject();
    delete obj.password;
    delete obj.ips;
    obj.level = parseInt(0.6 * Math.sqrt(((obj.wins ? obj.wins : 0) * 10) + ((obj.losses ? obj.losses : 0) * 5) + ((obj.wool_destroys ? obj.wool_destroys : 0) * 3) + ((obj.kills ? obj.kills : 0) * 2)), 10) + 1
    obj.levelRaw = 0.6 * Math.sqrt(((obj.wins ? obj.wins : 0) * 10) + ((obj.losses ? obj.losses : 0) * 5) + ((obj.wool_destroys ? obj.wool_destroys : 0) * 3) + ((obj.kills ? obj.kills : 0) * 2)) + 1
    obj.xp = ((obj.wins ? obj.wins : 0) * 10) + ((obj.losses ? obj.losses : 0) * 5) + ((obj.wool_destroys ? obj.wool_destroys : 0) * 3) + ((obj.kills ? obj.kills : 0) * 2);
    return obj;
};

MinecraftUser.methods.toFullJSON = function() {
    let obj = this.toObject();
    return obj;
};

MinecraftUser.methods.loadRanks = function (callback) {
    MinecraftRank.find({ _id: { $in: this.ranks } }, (err, ranks) => {
        if (err) console.log(err);
        
        callback(ranks);
    })
};
export const MinecraftUserModel = mongoose.model('minecraft_user', MinecraftUser);

const MinecraftRank = new Schema({
    name                : String,
    priority            : Number,
    prefix              : String,
    permissions         : [String],
    staff               : Boolean
});
export const MinecraftRankModel = mongoose.model('minecraft_rank', MinecraftRank);

const MinecraftServer = new Schema({
    name                : String,
    nameLower           : String,
    id                  : String,

    lastOnlineDate      : Number,
    players             : [ObjectId],
    playerNames         : [String],

    playerCount         : Number,
    spectatorCount      : Number,
    maxPlayers          : Number,
    map                 : String,
    gametype            : String
});
export const MinecraftServerModel = mongoose.model('minecraft_server', MinecraftServer);

const MinecraftDeath = new Schema({
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
export const MinecraftDeathModel = mongoose.model('minecraft_death', MinecraftDeath);

const MinecraftMap = new Schema({
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
export const MinecraftMapModel = mongoose.model('minecraft_map', MinecraftMap);

const MinecraftMatch = new Schema({
    map             : ObjectId,
    initializedDate : Number,
    startedDate     : Number,
    finishedDate    : Number,
    winners: [ObjectId],
    losers: [ObjectId],
    participants: [ObjectId],
    winningTeam: String,
    teamMappings: [{
        team: String,
        player: ObjectId
    }],
    finished: Boolean
});
export const MinecraftMatchModel = mongoose.model('minecraft_match', MinecraftMatch);

const MinecraftMatchChat = new Schema({
    match: ObjectId,
    user: ObjectId,
    username: String,
    uuid: String,
    message: String,
    team: String,
    matchTime: Number,
    teamChat: Boolean
});
export const MinecraftMatchChatModel = mongoose.model('minecraft_match_chat', MinecraftMatchChat);