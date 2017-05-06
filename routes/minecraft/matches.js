var mongoose = require("mongoose");
var verifyServer = require('./verifyServer');
var async = require('async');
var User = mongoose.model('user');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var MinecraftMatch = mongoose.model('minecraft_match');
var MinecraftMap = mongoose.model('minecraft_map');

module.exports = function(app) {

    /**
     * body: MatchLoadRequest.java
     */
    app.post('/mc/match/load', verifyServer, function(req, res) {
       var match = new MinecraftMatch({
           initializedDate: new Date().getTime(),
           finished: false
       });
       match.save(function(err) {
           res.json(match);
       });
    });

    /**
     * body: MatchInProgress.java
     */
    app.post('/mc/match/finish', verifyServer, function(req, res) {
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
                        MinecraftMatch.update({_id: mongoose.Types.ObjectId(req.body._id)}, {$set: {
                            map: mongoose.Types.ObjectId(req.body.map),
                            startedDate: req.body.startedDate,
                            finishedDate: req.body.finishedDate,
                            chat: req.body.chat,
                            deaths: fixedDeaths,
                            winners: fixedWinners,
                            losers: fixedLosers,
                            teamMappings: req.body.teamMappings
                        }}, function(err) {
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

    app.get('/mc/match/:id', function(req, res, next) {
        MinecraftMatch.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, match) {

            if(match) {
                var combinedIds = new Array();
                var usersCombined = new Array();

                var mapLoaded = {};
                var deathsLoaded = new Array();
                var winnersLoaded = new Array();
                var losersLoaded = new Array();
                var playerStats = new Array();
                var teamsLoaded = new Array();
                async.series([

                    //load map
                    function(callback) {
                        MinecraftMap.findOne({_id: match.map}, function(err, map) {
                            if(err) console.log(err);

                            mapLoaded = map;
                            console.log('map name: ' + map.name);
                            callback();
                        })
                    },

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
                            if(err) console.log(err);

                            async.eachSeries(deaths, function(death, next) {

                                Common.matchPlayerWithId(usersCombined, death.player, function(found) {
                                    death.playerLoaded = found;

                                    Common.matchPlayerWithId(usersCombined, death.killer, function(found) {
                                        death.killerLoaded = found;
                                        next();
                                    })
                                });
                            }, function(err) {
                                async.eachSeries(usersCombined, function(user, next) {

                                    var playerStat = {
                                        name: user.name,
                                        uuid: user.uuid,
                                        _id: user._id,
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

                                        async.eachSeries(deaths, function(death, next) {
                                            deathsLoaded.push(death);
                                            next();
                                        }, function(err) {
                                            next();
                                        })
                                    })
                                }, function(err) {
                                    callback();
                                })
                            })
                        })
                    },

                    //group players into their teams
                    function(callback) {
                        var teams = new Array();
                        console.log('sorting teams...');
                        async.eachSeries(mapLoaded.teams, function(team, next) {
                            console.log('map team: ' + team.id);
                            teams.push({
                                id: team.id,
                                name: team.name,
                                color: team.color,
                                min: team.min,
                                max: team.max,
                                members: new Array(),
                                winners: team.id == match.winningTeam
                            })
                            next();
                        }, function(err) {
                            async.eachSeries(match.teamMappings, function(teamMap, next) {

                                async.eachSeries(teams, function(team, next) {
                                    console.log('comparing teams: ' + team.id + " | " + teamMap.team);
                                    if(team.id.toString() == teamMap.team) {
                                        //get the loaded player
                                        Common.matchPlayerWithId(playerStats, teamMap.player, function(statPlayer) {
                                            team.members.push(statPlayer);
                                            next();
                                        })
                                    } else {
                                        next();
                                    }
                                }, function(err) {
                                    next();
                                })
                            }, function(err) {
                                teamsLoaded = teams;
                                callback();
                            })
                        })
                    }
                ], function(err) {
                    res.json({
                        match: match,
                        playersLoaded: usersCombined,
                        winnersLoaded: winnersLoaded,
                        losersLoaded: losersLoaded,
                        playerStats: playerStats,
                        deathsLoaded: deathsLoaded,
                        mapLoaded: mapLoaded,
                        teamsLoaded: teamsLoaded
                    })
                })
            } else {
                res.json({notFound: true})
            }
        });
    });

}