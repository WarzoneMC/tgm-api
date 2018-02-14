var mongoose = require("mongoose");
var verifyServer = require('./verifyServer');
var async = require('async');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var MinecraftMatch = mongoose.model('minecraft_match');

var MinecraftPunishment = mongoose.model('minecraft_punishment');

module.exports = function(app) {

    app.get('/mc/player/:name', function(req, res, next) {
        MinecraftUser.findOne({nameLower: req.params.name.toLowerCase()}, function(err, user) {
            if(err) {
                console.log(err);
                res.json({error: true});
            }
            if(user) {
                var deaths = new Array();
                var matches = new Array();

                async.series([
                    function(callback) {
                        if(true) {
                            console.log('including deaths in player response.');
                            MinecraftDeath
                                .find({$or: [{player: user._id}, {killer: user._id}]})
                                .sort('-date')
                                .limit(10)
                                .exec(function(err, foundDeaths) {
                                    if(err) {
                                        console.log(err);
                                    }
                                    var containing = new Array();
                                    async.eachSeries(foundDeaths, function(death, next) {
                                        containing.push(death.player);
                                        if(death.killer) {
                                            containing.push(death.killer);
                                        }
                                        next();
                                    }, function(err) {
                                        MinecraftUser.find({_id: {$in: containing}}, function(err, players) {
                                            if(err) console.log(err);

                                            async.eachSeries(foundDeaths, function(death, next) {

                                                Common.matchPlayerWithId(players, death.player, function(found) {
                                                    death.playerLoaded = found;

                                                    Common.matchPlayerWithId(players, death.killer, function(found) {
                                                        death.killerLoaded = found;

                                                        console.log('loaded player: ' + death.playerLoaded.name);
                                                        next();
                                                    })
                                                });
                                            }, function(err) {
                                                deaths = foundDeaths;
                                                callback();
                                            })
                                        })
                                    })
                                })
                        } else {
                            callback();
                        }
                    },
                    function(callback) {
                        if (true) {
                            MinecraftMatch
                                .find({matches: {$in: user.matches}})
                                .sort('-finishedDate')
                                .limit(10)
                                .exec(function(err, foundMatches) {
                                    if(err) console.log(err);
                                    matches = foundMatches;
                                    callback();
                                })
                        } else {
                            callback();
                        }
                    }
                ], function(err) {
                    res.json({
                        user: user,
                        deaths: deaths,
                        matches: matches
                    });
                })
            } else {
                res.json({notFound: true});
            }
        });
    });

    //Not being used
    app.get('/mc/player/deaths', function(req, res) {
        MinecraftDeath
            .find({})
            .sort('-date')
            .limit(4)
            .exec(function(err, foundDeaths) {
                if(err) {
                    console.log(err);
                }
                var containing = new Array();
                async.eachSeries(foundDeaths, function(death, next) {
                    containing.push(death.player);
                    if(death.killer) {
                        containing.push(death.killer);
                    }
                    next();
                }, function(err) {
                    MinecraftUser.find({_id: {$in: containing}}, function(err, players) {
                        if(err) console.log(err);

                        async.eachSeries(foundDeaths, function(death, next) {

                            matchPlayerWithId(players, death.player, function(found) {
                                death.playerLoaded = found;

                                matchPlayerWithId(players, death.killer, function(found) {
                                    death.killerLoaded = found;

                                    console.log('loaded player: ' + death.playerLoaded.name);
                                    next();
                                })
                            });
                        }, function(err) {
                            res.json(deaths);
                        })
                    })
                })
            })
    })

    app.post('/mc/player/login', verifyServer, function(req, res) {
        console.log('login request');
        MinecraftUser.findOne({
            uuid: req.body.uuid
        }, function(err, user) {
            if(err) throw err;
            console.log('body: ' + JSON.stringify(req.body, null, 2));

            if(user) {
                var ips = user.ips;
                if (req.body.ip) {
                    if(ips.indexOf(req.body.ip) >= 0) {
                        ips.splice(ips.indexOf(req.body.ip), 1);
                    }
                    ips.push(req.body.ip);
                }
                MinecraftUser.update({uuid: req.body.uuid}, {$set: {
                    name: req.body.name,
                    nameLower: req.body.name.toLowerCase(),
                    lastOnlineDate: new Date().getTime(),
                    ips: ips
                }}, function(err) {
                    if (err) console.log(err);
                    MinecraftPunishment.find(
                        {
                            $or: [
                                {
                                    punished: user._id,
                                    reverted: false
                                }, {
                                    ip: req.body.ip,
                                    ip_ban: true
                                }
                            ]
                        }).sort('+issued').exec(function (err, punishes) {
                        if (err) console.log(err);
                        var punishments = new Array();
                        for (var i in punishes) {
                            var punishment = punishes[i];
                            if (punishment) {
                                punishments = punishments.filter(function(p){
                                    return p.type !== punishment.type;
                                });
                                punishments.push(punishment);
                                if (!punishment.isActive()) punishments.pop();
                            }
                        }
                        user.punishments = punishments;
                        res.json(user);
                        console.log('user: ' + JSON.stringify(user, null, 2));
                        console.log('Minecraft User login: ' + user.name);
                    });
                });
            } else {
                user = new MinecraftUser({
                    name: req.body.name,
                    nameLower: req.body.name.toLowerCase(),
                    uuid: req.body.uuid,

                    initialJoinDate: new Date().getTime(),
                    lastOnlineDate: new Date().getTime(),

                    ranks: [],
                    ips: [req.body.ip]
                });
                user.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                    MinecraftPunishment.find({ip: req.body.ip, ip_ban: true}).sort('+issued').exec(function (err, punishes) {
                        var punishments = new Array();
                        for (var i in punishes) {
                            var punishment = punishes[i];
                            if (punishment) {
                                punishments = punishments.filter(function(p){
                                    return p.type !== punishment.type;
                                });
                                punishments.push(punishment);
                                if (!punishment.isActive()) punishments.pop();
                            }
                        }
                        user.punishments = punishments;
                        res.json(user);
                        console.log('Registered new minecraft user: ' + user.name);
                    });
                })
            }
        });
    });

    app.post('/mc/player/issue_punishment', verifyServer, function(req, res) {
        if (req.body.name) {
            MinecraftUser.find({nameLower: req.body.name.toLowerCase()}).sort('-lastOnlineDate').limit(1).exec(function(err, users){
                var punished = users[0];
                if (punished) {
                    MinecraftUser.find({uuid: req.body.punisherUuid}).sort('-lastOnlineDate').limit(1).exec(function(err, punishers){
                        var punisher = punishers[0];
                        if (punisher) {
                            var punishment = new MinecraftPunishment({
                                punisher: punisher._id,
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
                        } else {
                            res.json({notFound: true});
                        }
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
                    if (punishment.punished.toString() !== punishment.punisher.toString()) ids.push(punishment.punisher);
                    var loadedUsers = [];
                    async.eachSeries(ids, function (id, next) {
                        MinecraftUser.findOne({_id: id}, function (err, user) {
                            loadedUsers.push({
                                name: user.name,
                                id: user._id,
                                success: success
                            });
                            next();
                        });
                    }, function (err) {
                        punishment.reverted = true;
                        res.json({
                            punishment: punishment,
                            loadedUsers: loadedUsers
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
        if (req.body.ip) {
            var ids = [];
            var punishments = [];
            var loadedUsers = [];
            MinecraftPunishment.find({ip: req.body.ip}).exec(function(err, punishes) {
                for (var i in punishes) {
                    var punishment = punishes[i];
                    if (!ids.includes(punishment.punisher.toString())) {
                        ids.push(punishment.punisher.toString());
                    }
                    if (punishment.punished && !ids.includes(punishment.punished.toString())) {
                        ids.push(punishment.punished.toString());
                    }
                    punishments.push(punishment);
                }
                async.eachSeries(ids, function (id, next) {
                    MinecraftUser.findOne({_id: id}, function(err, user1) {
                        if (user1) {
                            loadedUsers.push({
                                id: user1._id,
                                name: user1.name
                            });
                        }
                        next();
                    });
                }, function (err){
                    if (err) console.log(err);
                    res.json({
                        punishments: punishments,
                        loadedUsers: loadedUsers
                    });
                });
            });
            
        } else if (req.body.name) {
            MinecraftUser.find({nameLower: req.body.name.toLowerCase()}).sort('-lastOnlineDate').limit(1).exec(function(err, users){
                if (err) console.log(err);
                var user = users[0];
                if (user) {
                    MinecraftPunishment.find({punished: user._id}).exec(function(err, punishments) {
                        if (err) console.log(err);
                        var ids = [];
                        async.eachSeries(punishments, function (punishment, next) {
                            if (!ids.includes(punishment.punisher.toString())) {
                                ids.push(punishment.punisher.toString());
                            }
                            if (!ids.includes(punishment.punished.toString())) {
                                ids.push(punishment.punished.toString());
                            }
                            next();
                        }, function (err){
                            var loadedUsers = [];
                            async.eachSeries(ids, function (id, next) {
                                MinecraftUser.findOne({_id: id}, function(err, user1) {
                                if (user1) {
                                    loadedUsers.push({
                                        id: user1._id,
                                        name: user1.name
                                    });
                                }
                                next();
                            });
                            }, function (err){
                                if (err) console.log(err);
                                user.matches = [];
                                res.json({
                                    punishments: punishments,
                                    loadedUsers: loadedUsers
                                });
                            });
                            
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

}