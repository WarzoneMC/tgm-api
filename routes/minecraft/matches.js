var mongoose = require("mongoose");
import verifyServer from './verifyServer';
var async = require('async');
import config from '../../config';

import { MinecraftUserModel, MinecraftMatchModel, MinecraftMapModel, MinecraftDeathModel, MinecraftMatchChatModel } from "../../models/minecraft";
import express from 'express';
import { resolve } from "path";
const router = express.Router();

/**
 * Increments user's wool break count by 1.
 *
 * Called when user breaks a wool mid-match.
 */
router.post('/mc/match/destroy_wool', verifyServer, (req, res) => {
    MinecraftUserModel.update({ uuid: req.body.uuid }, { $inc: { wool_destroys: 1 } }, (err) => {
        res.json({});
    })
})

/**
 * body: MatchLoadRequest.java
 */
router.post('/mc/match/load', verifyServer, function (req, res) {
    var match = new MinecraftMatchModel({
        initializedDate: new Date().getTime(),
        finished: false,
        map: mongoose.Types.ObjectId(req.body.map)
    });
    match.save(function (err) {
        if (err) console.log(err);

        console.log('created new match: ' + match._id);
        res.json(match);
    });
});

/**
 * body: MatchFinishPacket.java
 */
router.post('/mc/match/finish', verifyServer, async (req, res) => {
    console.log('match finish body:', req.body);

    const deaths = [];
    for(let death of req.body.deaths) {
        deaths.push(new mongoose.Types.ObjectId(death));
    }
    
    const allUserids = [];
    const winners = [];
    for(let winner of req.body.deaths) {
        winners.push(new mongoose.Types.ObjectId(winner));
        allUserIds.push(new mongoose.Types.ObjectId(winner));
    }

    const losers = [];
    for(let loser of req.body.winners) {
        losers.push(new mongoose.Types.ObjectId(loser));
        allUserIds.push(new mongoose.Types.ObjectId(loser));
    }

    await MinecraftMatchModel.findByIdAndUpdate(req.body.id, {
        $set: {
            map: new mongoose.Types.ObjectId(req.body.map),
            startedDate: req.body.startedDate,
            finishedDate: req.body.finishedDate,
            deaths: deaths,
            winners: winners,
            losers: loser,
            teamMappings: req.body.teamMappings,
            winningTeam: req.body.winningTeam,
            participants: allUserids
        }
    }).exec();

    if(config.saveChat) {
        // async
        new Promise((resolve, reject) => {
            console.log('Inserting chat into DB...');
            let timeStarted = Date.now();
            for(let chat of req.body.chat) {
                const chatDoc = new MinecraftMatchChatModel({
                    match: new mongoose.Types.ObjectId(req.body.id),
                    user: new mongoose.Types.ObjectId(chat.user),
                    username: chat.username,
                    uuid: chat.uuid,
                    message: chat.message,
                    team: chat.team,
                    matchTime: chat.matchTime,
                    teamChat: chat.teamChat
                });
                await chatDoc.save();
            }
            let timeDiff = Date.now() - timeStarted;
            console.log(`Finished inserting chat after ${timeDiff}ms`);
        })
    }

    await MinecraftUserModel.updateMany({_id: { $in: winners }}, {$inc: { wins: 1}}).exec();
    await MinecraftUserModel.updateMany({_id: { $in: losers }}, {$inc: { losses: 1}}).exec();
    await MinecraftUserModel.updateMany({_id: { $in: allUserIds}}, {$addToSet: { matches: mongoose.Types.ObjectId(req.body.id) }}).exec();

    res.json({});
});

router.get('/mc/match/latest/:playerName', function (req, res, next) {
    MinecraftUserModel.findOne({ nameLower: req.params.playerName.toLowerCase() }, function (err, user) {
        MinecraftMatchModel
            .find({ _id: { $in: user.matches } })
            .limit(5)
            .sort("-finishedDate")
            .exec(function (err, matches) {
                var recentMatches = new Array();
                async.eachSeries(matches, function (match, next) {
                    async.series([
                        //load map
                        function (callback) {
                            MinecraftMapModel.findOne({ _id: match.map }, function (err, map) {
                                recentMatches.push({
                                    match: match,
                                    loadedMap: map,
                                    timeElapsed: Common.toMMSS((match.finishedDate - match.startedDate) / 1000),
                                    matchSize: match.winners.length + match.losers.length
                                });

                                callback();
                            })
                        }
                    ], function (err) {
                        next();
                    })
                }, function (err) {
                    res.json(recentMatches);
                })
            })
    })
});

router.get('/mc/match/latest', function (req, res, next) {
    MinecraftMatchModel
        .find({})
        .limit(4)
        .sort("-finishedDate")
        .exec(function (err, matches) {
            var recentMatches = new Array();
            async.eachSeries(matches, function (match, next) {
                async.series([
                    //load map
                    function (callback) {
                        MinecraftMap.findOne({ _id: match.map }, function (err, map) {
                            recentMatches.push({
                                match: match,
                                loadedMap: map,
                                timeElapsed: Common.toMMSS((match.finishedDate - match.startedDate) / 1000),
                                matchSize: match.winners.length + match.losers.length
                            });

                            callback();
                        })
                    }
                ], function (err) {
                    next();
                })
            }, function (err) {
                res.json(recentMatches);
            })
        })
});

router.get('/mc/match/:id', function (req, res, next) {
    MinecraftMatchModel.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, function (err, match) {

        if (match) {
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
                function (callback) {
                    MinecraftMapModel.findOne({ _id: match.map }, function (err, map) {
                        if (err) console.log(err);

                        mapLoaded = map;
                        console.log('map name: ' + map.name);
                        callback();
                    })
                },

                //group winner and loser player objects so we only query once.
                function (callback) {
                    async.eachSeries(match.winners, function (winner, next) {
                        combinedIds.push(winner);
                        next();
                    }, function (err) {
                        callback();
                    })
                },
                function (callback) {
                    async.eachSeries(match.losers, function (loser, next) {
                        combinedIds.push(loser);
                        next();
                    }, function (err) {
                        callback();
                    })
                },

                //load winner and loser player objects.
                function (callback) {
                    MinecraftUserModel.find({ _id: { $in: combinedIds } }, function (err, users) {
                        if (err) console.log(err);

                        async.series([
                            function (callback) {
                                async.eachSeries(match.winners, function (winner, next) {
                                    Common.matchPlayerWithId(users, winner, function (player) {
                                        winnersLoaded.push(player);
                                        usersCombined.push(player);
                                        next();
                                    })
                                }, function (err) {
                                    callback();
                                })
                            },
                            function (callback) {
                                async.eachSeries(match.losers, function (loser, next) {
                                    Common.matchPlayerWithId(users, loser, function (player) {
                                        losersLoaded.push(player);
                                        usersCombined.push(player);
                                        next();
                                    })
                                }, function (err) {
                                    callback();
                                })
                            }
                        ], function (err) {
                            callback();
                        })
                    })
                },

                //Load deaths for the match and calculate each player's stats (kdr)
                function (callback) {
                    MinecraftDeathModel.find({ match: match._id }, function (err, deaths) {
                        if (err) console.log(err);

                        console.log('found ' + deaths.length + ' deaths.');

                        async.eachSeries(deaths, function (death, next) {

                            Common.matchPlayerWithId(usersCombined, death.player, function (found) {
                                death.playerLoaded = found;

                                Common.matchPlayerWithId(usersCombined, death.killer, function (found) {
                                    death.killerLoaded = found;
                                    next();
                                })
                            });
                        }, function (err) {
                            var deathsCache = new Array();
                            async.eachSeries(usersCombined, function (user, next) {

                                var playerStat = {
                                    name: user.name,
                                    uuid: user.uuid,
                                    _id: user._id,
                                    kills: 0,
                                    deaths: 0,
                                    kdr: 0
                                };

                                async.eachSeries(deaths, function (death, next) {
                                    if (death.player.toString() == user._id.toString()) {
                                        playerStat.deaths = playerStat.deaths + 1;
                                    }
                                    else if (death.killer != null && death.killer.toString() == user._id.toString()) {
                                        playerStat.kills = playerStat.kills + 1;
                                    }

                                    if (deaths == 0) {
                                        playerStat.kdr = (playerStat.kills / 1).toFixed(2);
                                    } else {
                                        playerStat.kdr = (playerStat.kills / playerStat.deaths).toFixed(2)
                                    }
                                    next();

                                }, function (err) {
                                    playerStats.push(playerStat);
                                    next();
                                })
                            }, function (err) {
                                deathsLoaded = deaths;
                                callback();
                            })
                        })
                    })
                },

                //group players into their teams
                function (callback) {
                    var teams = new Array();
                    console.log('sorting teams...');
                    async.eachSeries(mapLoaded.teams, function (team, next) {
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
                    }, function (err) {
                        async.eachSeries(match.teamMappings, function (teamMap, next) {

                            async.eachSeries(teams, function (team, next) {
                                console.log('comparing teams: ' + team.id + " | " + teamMap.team);
                                if (team.id.toString() == teamMap.team) {
                                    //get the loaded player
                                    Common.matchPlayerWithId(playerStats, teamMap.player, function (statPlayer) {
                                        team.members.push(statPlayer);
                                        team.kills += statPlayer.kills;
                                        team.deaths += statPlayer.deaths;
                                        next();
                                    })
                                } else {
                                    next();
                                }
                            }, function (err) {
                                next();
                            })
                        }, function (err) {
                            teamsLoaded = teams;
                            callback();
                        })
                    })
                }
            ], function (err) {
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
            res.json({ notFound: true })
        }
    });
});

export default router;