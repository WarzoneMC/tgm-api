var mongoose = require("mongoose");
var verifyServer = require('./verifyServer');
var async = require('async');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftPunishment = mongoose.model('minecraft_punishment');

module.exports = function(app) {

    app.post('/mc/player/issue_punishment', verifyServer, function(req, res) {
        if (req.body.name) {
            MinecraftUser.find({nameLower: req.body.name.toLowerCase()}).sort('-lastOnlineDate').limit(1).exec(function(err, users){
                var punished = users[0];
                if (punished) {
                    MinecraftUser.find({uuid: req.body.punisherUuid}).sort('-lastOnlineDate').limit(1).exec(function(err, punishers){
                        var punisher = punishers[0];
                        var punishment = new MinecraftPunishment({
                            punisher: punisher ? punisher._id : null,
                            punished: punished._id,
                            
                            ip: (req.body.ip ? req.body.ip : punished.ips[punished.ips.length - 1]),
                            ip_ban: (req.body.ip_ban ? req.body.ip_ban : false),

                            type: req.body.type.toUpperCase(),

                            issued: new Date().getTime(),
                            expires: (req.body.length != -1 ? new Date().getTime() + req.body.length : -1),

                            reason: req.body.reason,
                            reverted: false
                        });
                        punishment.save(function(err) {
                            if (err) {
                                console.log(err);
                            }
                            console.log("Saved punishment: " + JSON.stringify(punishment))
                            res.json({
                                punishment: punishment,
                                kickable: punishment.shouldKick(),
                                
                                name: punished.name
                            });
                        });
                        
                    });
                } else {
                    res.json({notFound: true});
                }
            });
        } else if (req.body.ip) {
            MinecraftUser.find({uuid: req.body.punisherUuid}).sort('-lastOnlineDate').limit(1).exec(function(err, punishers){
                var punisher = punishers[0];
                if (punisher) {
                    var punishment = new MinecraftPunishment({
                        punisher: punisher._id,
                        punished: null,
                        
                        ip: req.body.ip,
                        ip_ban: true,

                        type: req.body.type.toUpperCase(),

                        issued: new Date().getTime(),
                        expires: (req.body.length != -1 ? new Date().getTime() + req.body.length : -1),

                        reason: req.body.reason,
                        reverted: false
                    });
                    punishment.save(function(err) {
                        if (err) {
                            console.log(err);
                        }
                        res.json({
                            punishment: punishment,
                            kickable: punishment.shouldKick(),
                            ip: punishment.ip
                        });
                    });
                } else {
                    res.json({notFound: true});
                }
            });
        } else {
            res.json({notFound: true});
        }
    });

    app.post('/mc/player/revert_punishment', verifyServer, function(req, res) {
        MinecraftPunishment.findOne({ _id: req.body.id }, function(err, punishment) {
            var success = punishment.reverted == false;
            if (err) console.log(err);
            if (punishment) {
                MinecraftPunishment.update({ _id: req.body.id }, {$set: { reverted: true }}, function(err) {
                    if (err) console.log(err);
                    var ids = [];
                    ids.push(punishment.punished);
                    if (punishment.punisher && punishment.punished.toString() !== punishment.punisher.toString()) ids.push(punishment.punisher);
                    var loadedUsers = [];
                    async.eachSeries(ids, function (id, next) {
                        MinecraftUser.findOne({_id: id}, function (err, user) {
                            loadedUsers.push({
                                name: user.name,
                                id: user._id
                            });
                            next();
                        });
                    }, function (err) {
                        punishment.reverted = true;
                        res.json({
                            punishment: punishment,
                            loadedUsers: loadedUsers,
                            success: success
                        });
                        console.log("Reverted punishment: " + punishment._id); 
                    });
                    
                });
            } else {
                res.json({notFound: true});
            }
        });
        
    });

    app.post('/mc/player/punishments', verifyServer, function(req, res) {
        var result;
        if (req.body.ip) result = MinecraftUser.find({ips: req.body.ip});
        else if (req.body.name) result = MinecraftUser.find({nameLower: req.body.name.toLowerCase()}).sort('-lastOnlineDate').limit(1);
        else {
            res.json({notFound: true});
            return;
        }
        result.exec(function(err, users) {
            if (users.length == 0) {
                res.json({notFound: true});
                return;
            }
            if (err) console.log(err);
            var loadedPunishments = [];
            var loadedUsers = {};
            var ids = [];
            async.eachSeries(users, function (user, next) {
                MinecraftPunishment.find(req.body.ip ? {punished: user._id, ip: req.body.ip} : {punished: user._id}).exec(function(err, punishments) {
                    if (err) console.log(err);
                    for (var i in punishments) {
                        var punishment = punishments[i];
                        if (punishment.punisher && !ids.includes(punishment.punisher.toString())) ids.push(punishment.punisher.toString());
                        if (punishment.punished && !ids.includes(punishment.punished.toString())) ids.push(punishment.punished.toString());
                        loadedPunishments.push(punishment.toJSON());
                    }                    
                    next();
                });
            }, function (err){
                async.eachSeries(ids, function (id, next) {
                    MinecraftUser.findOne({_id: id}, function(err, foundUser) {
                        if (foundUser) {
                            var finalUser = foundUser.toJSON();
                            delete finalUser.matches;
                            loadedUsers[id] = finalUser;
                        }
                        next();
                    });
                }, function (err){
                    for (var i in loadedPunishments) {
                        var punishment = loadedPunishments[i];
                        if (punishment.punisher && loadedUsers[punishment.punisher]) punishment.punisherLoaded = loadedUsers[punishment.punisher];
                        if (punishment.punished && loadedUsers[punishment.punished]) punishment.punishedLoaded = loadedUsers[punishment.punished];
                    }
                    var loadedUsersLegacy = [];
                    for (var id in loadedUsers) loadedUsersLegacy.push({id: loadedUsers[id]._id, name: loadedUsers[id].name});
                    res.json({
                        punishments: loadedPunishments,
                        loadedUsers: loadedUsersLegacy
                    });
                });
            });
        });
        
    });

    app.get('/mc/punishment/latest', function(req, res) {
        var limit = req.query.limit && Number.isInteger(parseInt(req.query.limit)) && parseInt(req.query.limit) <= 20 ? parseInt(req.query.limit) : 10;
        MinecraftPunishment.find({reverted: false}).sort("-issued").limit(limit).exec(function (err, puns){
            var punishments = new Array();
            async.eachSeries(puns, function (pun, next) {
                var punishment = pun.toJSON();
                MinecraftUser.findOne({_id: pun.punisher}, function(err, punisher){
                    if (err) console.log(err);
                    if (punisher) {
                        var punisherLoaded = punisher.toJSON();
                        delete punisherLoaded.matches;
                        punishment.punisherLoaded = punisherLoaded;
                    } else {
                        punishment.punisherLoaded = null;
                    }
                    MinecraftUser.findOne({_id: pun.punished}, function(err, punished){
                        if (err) console.log(err);
                        if (punished) {
                            var punishedLoaded = punished.toJSON();
                            delete punishedLoaded.matches;
                            punishment.punishedLoaded = punishedLoaded;
                        } else {
                            punishment.punishedLoaded = null;
                        }
                        delete punishment.ip;
                        punishments.push(punishment);
                        next();
                    })
                })
                
            }, function(err) {
                res.json(punishments);
            });
        });
    });
};