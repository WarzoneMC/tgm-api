let mongoose = require("mongoose");
let verifyServer = require('./verifyServer');
let async = require('async');

let MinecraftUser = mongoose.model('minecraft_user');
let MinecraftDeath = mongoose.model('minecraft_death');
let MinecraftMatch = mongoose.model('minecraft_match');
let MinecraftRank = mongoose.model('minecraft_rank');

module.exports = function(app) {

    app.get('/mc/player/:name', function(req, res, next) {
        MinecraftUser.findOne({nameLower: req.params.name.toLowerCase()}, function(err, user) {
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

    app.post('/mc/player/login', verifyServer, function(req, res) {
        console.log('login request');
        MinecraftUser.findOne({
            uuid: req.body.uuid
        }).lean().exec(function(err, user) {
            if(err) throw err;
            console.log('body: ' + JSON.stringify(req.body, null, 2));

            if(user) {
                let ips = user.ips;
                if(ips.indexOf(req.body.ip) < 0) {
                    ips.push(req.body.ip);
                }

                user.loadRanks((ranks) => {
                    user.ranksLoaded = ranks;
                    MinecraftUser.update({ uuid: req.body.uuid }, {
                        $set: {
                            name: req.body.name,
                            nameLower: req.body.name.toLowerCase(),
                            lastOnlineDate: new Date().getTime(),
                            ips: ips
                        }
                    }, function (err) {
                        res.json(user);
                        console.log('user: ' + JSON.stringify(user, null, 2));
                        console.log('Minecraft User login: ' + user.name);
                    });
                })
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
                    res.json(user);
                    console.log('Registered new minecraft user: ' + user.name);
                })
            }
        });
    });
}