var mongoose = require('mongoose');
var verifyServer = require('./verifyServer');
var async = require('async');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var MinecraftMatch = mongoose.model('minecraft_match');
var MinecraftMap = mongoose.model('minecraft_map');

module.exports = function (app) {
    
    /**
     * Increments user's wool break count by 1.
     *
     * Called when user breaks a wool mid-match.
     */
    app.post('/mc/match/destroy_wool', verifyServer, (req, res) => {
        MinecraftUser.update({ uuid: req.body.uuid }, { $inc: { wool_destroys: 1 } }, (err) => {
            res.json({});
        })
    })

    /**
     * Increments user's wool pickup count by 1.
     *
     * Called when user picks up a wool mid-match.
     */
    app.post('/mc/match/wool_pickup', verifyServer, (req, res) => {
        MinecraftUser.update({ uuid: req.body.uuid }, { $inc: { wool_pickups: 1 } }, (err) => {
            res.json({});
        })
    })

    /**
     * Increments user's wool placement count by 1.
     *
     * Called when user places a wool mid-match.
     */
    app.post('/mc/match/place_wool', verifyServer, (req, res) => {
        MinecraftUser.update({ uuid: req.body.uuid }, { $inc: { wool_placements: 1 } }, (err) => {
            res.json({});
        })
    })

    /**
     * body: MatchLoadRequest.java
     */
    app.post('/mc/match/load', verifyServer, function(req, res) {
       var match = new MinecraftMatch({
           initializedDate: new Date().getTime(),
           finished: false,
           map: mongoose.Types.ObjectId(req.body.map)
       });
       match.save(function(err) {
           if(err) console.log(err);

           console.log('created new match: ' + match._id);
           res.json(match);
       });
    });

    /**
     * body: MatchInProgress.java
     */
    app.post('/mc/match/finish', verifyServer, function(req, res) {
        console.log('match body: ' + JSON.stringify(req.body, null, 2));

        var allUserIds = new Array();
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
                    allUserIds.push(winner);
                    next();
                }, function(err) {
                    var fixedLosers = new Array();
                    async.eachSeries(req.body.losers, function(loser, next) {
                        fixedLosers.push(mongoose.Types.ObjectId(loser));
                        allUserIds.push(loser);
                        next();
                    }, function(err) {
                        MinecraftMatch.update({_id: mongoose.Types.ObjectId(req.body.id)}, {$set: {
                            map: mongoose.Types.ObjectId(req.body.map),
                            startedDate: req.body.startedDate,
                            finishedDate: req.body.finishedDate,
                            chat: req.body.chat,
                            deaths: fixedDeaths,
                            winners: fixedWinners,
                            losers: fixedLosers,
                            teamMappings: req.body.teamMappings,
                            winningTeam: req.body.winningTeam
                        }}, function(err) {
                            if(err) {
                                console.log(err);
                            }
                            res.json({})
                        });

                        MinecraftUser.update({_id: {$in: fixedWinners}}, {$inc: {wins: 1, matches: 1}}, {multi: true}, function(err) {
                            if(err) console.log(err);
                            MinecraftUser.update({_id: {$in: fixedLosers}}, {$inc: {losses: 1, matches: 1}}, {multi: true}, function(err) {
                                if(err) console.log(err);
                            })
                        })
                    })
                })
            })
        });
    });

    app.get('/mc/match/latest/:playerName', function(req, res, next) {
        MinecraftUser.findOne({nameLower: req.params.playerName.toLowerCase()}, function(err, user) {
            MinecraftMatch
                .find({$or: [{winners: user._id}, {losers: user._id}]})
                .limit(5)
                .sort('-finishedDate')
                .exec(function(err, matches) {
                    var recentMatches = new Array();
                    async.eachSeries(matches, function(match, next) {
                        async.series([
                            //load map
                            function(callback) {
                                MinecraftMap.findOne({_id: match.map}, function(err, map) {
                                    recentMatches.push({
                                        match: match,
                                        loadedMap: map,
                                        timeElapsed: Common.toMMSS((match.finishedDate - match.startedDate) / 1000),
                                        matchSize: match.winners.length + match.losers.length
                                    });

                                    callback();
                                })
                            }
                        ], function(err) {
                            next();
                        })
                    }, function(err) {
                        res.json(recentMatches);
                    })
                })
        })
    });

    app.get('/mc/match/latest', function(req, res, next) {
        MinecraftMatch
            .find({})
            .limit(4)
            .sort('-finishedDate')
            .exec(function(err, matches) {
                var recentMatches = new Array();
                async.eachSeries(matches, function(match, next) {
                    async.series([
                        //load map
                        function(callback) {
                            MinecraftMap.findOne({_id: match.map}, function(err, map) {
                                recentMatches.push({
                                    match: match,
                                    loadedMap: map,
                                    timeElapsed: Common.toMMSS((match.finishedDate - match.startedDate) / 1000),
                                    matchSize: match.winners.length + match.losers.length
                                });

                                callback();
                            })
                        }
                    ], function(err) {
                        next();
                    })
                }, function(err) {
                    res.json(recentMatches);
                })
            })
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
                var miscData = {};
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
                        MinecraftDeath.find({match: match._id}, function(err, deaths) {
                            if(err) console.log(err);

                            console.log('found ' + deaths.length + ' deaths.');

                            async.eachSeries(deaths, function(death, next) {

                                Common.matchPlayerWithId(usersCombined, death.player, function(found) {
                                    death.playerLoaded = found;

                                    Common.matchPlayerWithId(usersCombined, death.killer, function(found) {
                                        death.killerLoaded = found;
                                        next();
                                    })
                                });
                            }, function(err) {
                                var deathsCache = new Array();
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
                                            playerStat.kdr = (playerStat.kills / 1).toFixed(2);
                                        } else {
                                            playerStat.kdr = (playerStat.kills / playerStat.deaths).toFixed(2)
                                        }
                                        next();

                                    }, function(err) {
                                        playerStats.push(playerStat);
                                        next();
                                    })
                                }, function(err) {
                                    deathsLoaded = deaths;
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
                                won: team.id == match.winningTeam,

                                kills: 0,
                                deaths: 0
                            })
                            next();
                        }, function(err) {
                            async.eachSeries(match.teamMappings, function(teamMap, next) {

                                async.eachSeries(teams, function(team, next) {
                                    console.log('comparing teams: ' + team.id + ' | ' + teamMap.team);
                                    if(team.id.toString() == teamMap.team) {
                                        //get the loaded player
                                        Common.matchPlayerWithId(playerStats, teamMap.player, function(statPlayer) {
                                            team.members.push(statPlayer);
                                            team.kills += statPlayer.kills;
                                            team.deaths += statPlayer.deaths;
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
                        teamsLoaded: teamsLoaded,
                        timeElapsed: Common.toMMSS((match.finishedDate - match.startedDate) / 1000)
                    })
                })
            } else {
                res.json({notFound: true})
            }
        });
    });

}
