let mongoose = require('mongoose');
let verifyServer = require('./verifyServer');
let async = require('async');
let Common = require('../../util/common');

let MinecraftUser = mongoose.model('minecraft_user');
let MinecraftDeath = mongoose.model('minecraft_death');
let MinecraftMatch = mongoose.model('minecraft_match');
let MinecraftRank = mongoose.model('minecraft_rank');

var MinecraftPunishment = mongoose.model('minecraft_punishment');

module.exports = function(app) {

    app.get('/mc/player/:name', function(req, res, next) {
        MinecraftUser.find({nameLower: req.params.name.toLowerCase()}).sort('-lastOnlineDate').limit(1).exec(function(err, users) {
            var user = users[0];
            if(err) {
                console.log(err);
                res.json({error: true});
            }
            if(user) {
                let deaths = new Array();
                let matches = new Array();

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
                                    let containing = new Array();
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
                let containing = new Array();
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

    app.post('/mc/player/lookup', verifyServer, function(req, res) {
        if (req.body.ip) {
            MinecraftUser.find({ips: Common.hash(req.body.ip)}).exec((err, users) => {
                if (err) console.log(err);
                var foundUsers = [];
                for (var i in users) {
                    var json = users[i].toFullJSON();
                    delete json.matches;
                    foundUsers.push(json);
                }
                res.json({
                    queryFilter: req.body.ip,
                    users: foundUsers
                })
            });
        } else if (req.body.name) {
            MinecraftUser.find({nameLower: req.body.name.toLowerCase()}).exec((err, users) => {
                if (err) console.log(err);
                var foundUsers = [];
                for (var i in users) {
                    var json = users[i].toFullJSON();
                    delete json.matches;
                    foundUsers.push(json);
                }
                res.json({
                    queryFilter: req.body.name,
                    users: foundUsers
                })
            });
        } else {
            res.json({
                error: true,
                message: 'Query filter not included in the request.'
            });
        }
    });

    app.post('/mc/player/login', verifyServer, function(req, res) {
        console.log('login request');
        MinecraftUser.findOne({
            uuid: req.body.uuid
        }).lean().exec(function(err, user) {
            if(err) throw err;
            console.log('body: ' + JSON.stringify(req.body, null, 2));

            if(user) {
                var ips = user.ips;
                if (req.body.ip) {
                    if(ips.indexOf(Common.hash(req.body.ip)) >= 0) {
                        ips.splice(ips.indexOf(Common.hash(req.body.ip)), 1);
                    }
                    ips.push(Common.hash(req.body.ip));
                }
                MinecraftPunishment.find(
                    {
                        $or: [
                            {
                                punished: user._id,
                                reverted: false
                            }, {
                                ip: Common.hash(req.body.ip),
                                ip_ban: true,
                                reverted: false
                            }
                        ]
                    }).sort('+issued').exec(function (err, punishes) {
                    if (err) console.log(err);
                    var isBanned = false;
                    var punishments = new Array();
                    for (var i in punishes) {
                        var punishment = punishes[i];
                        if (punishment) {
                            punishments = punishments.filter(function(p){
                                return p.type !== punishment.type;
                            });
                            if (punishment.isActive()) {
                                punishments.push(punishment);
                                if (punishment.isBan()) {
                                    isBanned = true;
                                }
                            }
                        }
                    }
                    var query = {
                        name: req.body.name,
                        nameLower: req.body.name.toLowerCase(),
                        ips: ips
                    };
                    if (!isBanned) {
                        query.lastOnlineDate = Date.now();
                    }
                    MinecraftUser.update({uuid: req.body.uuid}, {$set: query}, function(err) {
                        if (err) console.log(err);
                        user.punishments = punishments;
                        MinecraftRank.find({ _id: { $in: user.ranks } }, (err, ranks) => {
                            if (err) console.log(err);
                            user.ranksLoaded = ranks;
                            res.json(user);
                            console.log('user: ' + JSON.stringify(user, null, 2));
                            console.log('Minecraft User login: ' + user.name);
                        });
                    });
                });
            } else {
                var ip = Common.hash(req.body.ip);
                user = new MinecraftUser({
                    name: req.body.name,
                    nameLower: req.body.name.toLowerCase(),
                    uuid: req.body.uuid,

                    initialJoinDate: new Date().getTime(),
                    lastOnlineDate: new Date().getTime(),

                    ranks: [],
                    ips: [ip]
                });
                user.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                    MinecraftPunishment.find({ip: Common.hash(req.body.ip), ip_ban: true}).sort('+issued').exec(function (err, punishes) {
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
                        var userJson = user.toJSON();
                        userJson.punishments = punishments;
                        userJson.new = true;
                        res.json(userJson);
                        console.log('Registered new minecraft user: ' + user.name);
                    });
                })
            }
        });
    });
}