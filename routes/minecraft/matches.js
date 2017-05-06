var mongoose = require("mongoose");
var verifyServer = require('./verifyServer');
var async = require('async');
var User = mongoose.model('user');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var MinecraftMatch = mongoose.model('minecraft_match');

module.exports = function(app) {

    app.get('/mc/match/:id', function(req, res, next) {
        MinecraftMatch.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, match) {

            var combinedIds = new Array();
            var usersCombined = new Array();

            var deathsLoaded = new Array();
            var winnersLoaded = new Array();
            var losersLoaded = new Array();
            var playerStats = new Array();
            async.series([

                //group winner and loser player objects so we only query once.
                function(callback) {
                    async.eachSeries(match.winners, function(winner, next) {
                        combinedIds.push(winner);
                        next();
                    }, function(err) {
                        callback();
                    })
                },
                function(callback) {
                    async.eachSeries(match.losers, function(loser, next) {
                        combinedIds.push(loser);
                        next();
                    }, function(err) {
                        callback();
                    })
                },

                //load winner and loser player objects.
                function(callback) {
                    MinecraftUser.find({_id: {$in: combinedIds}}, function(err, users) {
                        if(err) console.log(err);

                        async.series([
                            function(callback) {
                                async.eachSeries(match.winners, function(winner, next) {
                                    Common.matchPlayerWithId(users, winner, function(player) {
                                        winnersLoaded.push(player);
                                        usersCombined.push(player);
                                        next();
                                    })
                                }, function(err) {
                                    callback();
                                })
                            },
                            function(callback) {
                                async.eachSeries(match.losers, function(loser, next) {
                                    Common.matchPlayerWithId(users, loser, function(player) {
                                        losersLoaded.push(player);
                                        usersCombined.push(player);
                                        next();
                                    })
                                }, function(err) {
                                    callback();
                                })
                            }
                        ], function(err) {
                            callback();
                        })
                    })
                },

                //Load deaths for the match and calculate each player's stats (kdr)
                function(callback) {
                    MinecraftDeath.find({_id: {$in: match.deaths}}, function(err, deaths) {

                        async.eachSeries(deaths, function(death, next) {

                            Common.matchPlayerWithId(usersCombined, death.player, function(found) {
                                death.playerLoaded = found;

                                Common.matchPlayerWithId(usersCombined, death.killer, function(found) {
                                    death.killerLoaded = found;

                                    deathsLoaded.push(death);

                                    next();
                                })
                            });
                        }, function(err) {
                            async.eachSeries(usersCombined, function(user, next) {

                                var playerStat = {
                                    name: user.name,
                                    kills: 0,
                                    deaths: 0,
                                    kdr: 0
                                };

                                async.eachSeries(deaths, function(death, next) {
                                    if(death.player.toString() == user._id.toString()) {
                                        playerStat.deaths = playerStat.deaths + 1;
                                    }
                                    else if (death.killer != null && death.killer.toString() == user._id.toString()) {
                                        playerStat.kills = playerStat.kills + 1;
                                    }

                                    if(deaths == 0) {
                                        playerStat.kdr = playerStat.kills / 1;
                                    } else {
                                        playerStat.kdr = playerStat.kills / playerStat.deaths
                                    }
                                    next();

                                }, function(err) {
                                    playerStats.push(playerStat);
                                    next();
                                })
                            }, function(err) {
                                callback();
                            })
                        })
                    })
                }
            ], function(err) {
                res.json({
                    playersLoaded: usersCombined,
                    winnersLoaded: winnersLoaded,
                    losersLoaded: losersLoaded,
                    playerStats: playerStats,
                    deathsLoaded: deathsLoaded
                })
            })

            if(err) {
                console.log(err);
                res.json({error: true});
            }
            if(match) {
                res.json(match);
            } else {
                res.json({notFound: true});
            }
        });
    });

    app.post('/mc/match/new', verifyServer, function(req, res) {
        console.log('match body: ' + JSON.stringify(req.body, null, 2));

        async.eachSeries(req.body.chat, function(chat, next) {
            chat.user = mongoose.Types.ObjectId(chat.user);
            next();
        }, function(err) {
            var fixedDeaths = new Array();
            async.eachSeries(req.body.deaths, function(death, next) {
                fixedDeaths.push(mongoose.Types.ObjectId(death));
                next();
            }, function(err) {
                var fixedWinners = new Array();
                async.eachSeries(req.body.winners, function(winner, next) {
                    fixedWinners.push(mongoose.Types.ObjectId(winner));
                    next();
                }, function(err) {
                    var fixedLosers = new Array();
                    async.eachSeries(req.body.losers, function(loser, next) {
                        fixedLosers.push(mongoose.Types.ObjectId(loser));
                        next();
                    }, function(err) {
                        var match = new MinecraftMatch({
                            map: mongoose.Types.ObjectId(req.body.map),
                            startedDate: req.body.startedDate,
                            finishedDate: req.body.finishedDate,
                            chat: req.body.chat,
                            deaths: fixedDeaths,
                            winners: fixedWinners,
                            losers: fixedLosers
                        });
                        match.save(function(err) {
                            if(err) {
                                console.log(err);
                            }
                           res.json({matchId: match._id})
                        });

                        MinecraftUser.update({_id: {$in: fixedWinners}}, {$inc: {wins: 1}}, function(err) {
                            if(err) console.log(err);
                            MinecraftUser.update({_id: {$in: fixedLosers}}, {$inc: {losses: 1}}, function(err) {
                                if(err) console.log(err);
                            })
                        })
                    })
                })
            })
        });
    });

}