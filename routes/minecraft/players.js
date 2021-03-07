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
        let simple = req.query.simple;
        var query;
        if (req.query.byUUID === ('true'||'false') && Boolean(req.query.byUUID)) {
            query = {uuid: req.params.name}
        } else {
            query = {nameLower: req.params.name.toLowerCase()};
        }
        MinecraftUser.find(query).sort('-lastOnlineDate').limit(1).exec(function(err, users) {
            var user = users[0];
            if(err) {
                console.error(err);
                res.json({error: true});
            }
            if(user) {
                let deaths = new Array();
                let matches = new Array();

                async.series([
                    function(callback) {
                        if (!simple) {
                            console.log('including deaths in player response.');
                            MinecraftDeath
                                .find({$or: [{player: user._id}, {killer: user._id}]})
                                .sort('-date')
                                .limit(10)
                                .exec(function(err, foundDeaths) {
                                    if(err) {
                                        console.error(err);
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
                                            if(err) console.error(err);

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
                    // Fill in matches
                    function(callback) {
                        if (!simple) {
                            MinecraftMatch
                                .find({$or: [{winners: user._id}, {losers: user._id}]})
                                .sort('-finishedDate')
                                .limit(10)
                                .exec(function(err, foundMatches) {
                                    if(err) console.error(err);
                                    matches = foundMatches;
                                    callback();
                                })
                        } else {
                            callback();
                        }
                    },
                    // Hash un-hashed ips
                    function(callback) {
                        var fixed = false;
                        if (user.ips) {
                            for (var i in user.ips) {
                                if (user.ips[i] && typeof user.ips[i] === 'string' && user.ips[i].includes('.')) {
                                    fixed = true;
                                    user.ips[i] = Common.hash(user.ips[i]);
                                }
                            }
                        } 
                        if (fixed) {
                            user.save(function (err, doc, n) {
                                if (err) console.error(err);
                                callback();
                            });
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
                    console.error(err);
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
                        if(err) console.error(err);

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
            MinecraftUser.find({$or:[{ ips: Common.hash(req.body.ip) }, { ips: req.body.ip }]}).exec((err, users) => {
                if (err) console.error(err);
                var foundUsers = [];
                for (var i in users) {
                    var json = users[i].toFullJSON();
                    delete json.matches;
                    delete json.ips;
                    foundUsers.push(json);
                }
                res.json({
                    queryFilter: req.body.ip,
                    users: foundUsers
                })
            });
        } else if (req.body.name) {
            MinecraftUser.find({nameLower: req.body.name.toLowerCase()}).exec((err, users) => {
                if (err) console.error(err);
                var foundUsers = [];
                for (var i in users) {
                    var json = users[i].toFullJSON();
                    delete json.matches;
                    delete json.ips;
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

    app.get('/mc/player/alts/:name', verifyServer, async function(req, res) {
        MinecraftUser.find({nameLower: req.params.name.toLowerCase()}).sort('-lastOnlineDate').limit(1).exec(async function(err, users) {
            if (err) console.error(err);
            var user = users[0];
            if (!user) {
                return res.json({
                    error: true,
                    message: "Player not found"
                });
            }
            var fixed = false;
            if (user.ips) {
                for (var i in user.ips) {
                    if (user.ips[i] && typeof user.ips[i] === 'string' && user.ips[i].includes('.')) {
                        fixed = true;
                        user.ips[i] = Common.hash(user.ips[i]);
                    }
                }
            }
            if (fixed) {
                await user.save();
            }
            var lookupUser = user.toFullJSON();
            delete lookupUser.matches;
            delete lookupUser.ips;
            MinecraftUser.find({ips: { $in: user.ips }}).exec(function(err, users) {
                if (err) console.error(err);
                var cleanUsers = [];
                for (var i in users) {
                    if (users[i].uuid !== user.uuid) {
                        var json = users[i].toFullJSON();
                        delete json.matches;
                        delete json.ips;
                        cleanUsers.push(json);
                    }
                }
                res.json({
                    lookupUser: lookupUser,
                    users: cleanUsers
                });
            });
        });        
    });

    app.post('/mc/player/login', verifyServer, function(req, res) {
        console.log('login request');
        MinecraftUser.findOne({
            uuid: req.body.uuid
        }).lean().exec(function(err, user) {
            if(err) throw err;
            console.log('body: ' + JSON.stringify(req.body, null, 2));

            if(user) {
                delete user.matches;
                var hashedIp = Common.hash(req.body.ip);
                var ips = user.ips;
                if (req.body.ip) {
                    if(ips.indexOf(hashedIp) == -1) {
                        ips.push(hashedIp);
                    }
                }
                ips = Common.removeDuplicates(ips);
                MinecraftPunishment.find(
                    {
                        $or: [
                            {
                                punished: user._id,
                                reverted: false
                            }, {
                                ip: hashedIp,
                                ip_ban: true,
                                reverted: false
                            }, {
                                ip: req.body.ip,
                                ip_ban: true,
                                reverted: false
                            }
                        ]
                    }).sort('+issued').exec(function (err, punishes) {
                    if (err) console.error(err);
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
                        if (err) console.error(err);
                        user.punishments = punishments;
                        MinecraftRank.find({$or: [
                            { _id: { $in: user.ranks } },
                            { default: true }
                        ]}, (err, ranks) => {
                            if (err) console.error(err);
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
                        console.error(err);
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

    app.post('/mc/player/:player/tags/add', verifyServer, function(req, res) {
        var tag = req.body.tag;
        if (!tag) {
            res.status(400).json({ error: true, message: "Tag not included." });
            return;
        }
        var query;
        if (req.params.player.length <= 16) {
            query = { nameLower: req.params.player.toLowerCase() };
        } else {
            query = { uuid: req.params.player };
        }
        MinecraftUser.find(query).sort('-lastOnlineDate').limit(1).exec((err, users) => {
            var user = users[0];
            if (!user) {
                res.status(404).json({ error: true, message: "Player not found." });
                return;
            }
            if (user.tags.includes(tag)) {
                res.status(403).json({ error: true, message: "User already has that tag." });
                return;
            }
            MinecraftUser.update({ _id: user._id }, {
                $addToSet: { tags: tag }
            }, (err) => {
                user.tags.push(tag);
                console.log('Added tag \'' + tag + '\' to ' + user.name + '\'s profile.');
                res.json({player: user.name, tags: user.tags, activeTag: user.activeTag});
                return;
            });
        });
    });

    app.post('/mc/player/:player/tags/remove', verifyServer, function(req, res) {
        var tag = req.body.tag;
        if (!tag) {
            res.status(400).json({ error: true, message: "Tag not included." });
            return;
        }
        var query;
        if (req.params.player.length <= 16) {
            query = { nameLower: req.params.player.toLowerCase() };
        } else {
            query = { uuid: req.params.player };
        }
        MinecraftUser.find(query).sort('-lastOnlineDate').limit(1).exec((err, users) => {
            var user = users[0];
            if (!user) {
                res.status(404).json({ error: true, message: "Player not found." });
                return;
            }
            var tags = user.tags;
            if (!tags.includes(tag)) {
                res.status(403).json({ error: true, message: "User does not have that tag." });
                return;
            }
            tags.splice(tags.indexOf(tag), 1);
            if (user.activeTag === tag) user.activeTag = null;
            MinecraftUser.update({ _id: user._id }, {
                tags, activeTag: user.activeTag
            }, (err) => {
                console.log('Removed tag \'' + tag + '\' removed ' + user.name + '\'s profile.');
                res.json({player: user.name, tags: user.tags, activeTag: user.activeTag});
                return;
            });
        });
    });

    app.post('/mc/player/:player/tags/set', verifyServer, function(req, res) {
        var tag = req.body.tag;
        var query;
        if (req.params.player.length <= 16) {
            query = { nameLower: req.params.player.toLowerCase() };
        } else {
            query = { uuid: req.params.player };
        }
        MinecraftUser.find(query).sort('-lastOnlineDate').limit(1).exec((err, users) => {
            var user = users[0];
            if (!user) {
                res.status(404).json({ error: true, message: "Player not found." });
                return;
            }
            if (tag && tag !== "") {
                if (!user.tags.includes(tag)) {
                    res.status(403).json({ error: true, message: "Tag not found." });
                    return;
                }
                else if (user.activeTag === tag) {
                    res.status(403).json({ error: true, message: "Already using that tag." });
                    return;
                }
            } else {
                tag = null;
            }
            MinecraftUser.update({ _id: user._id }, {
                activeTag: tag
            }, (err) => {
                user.activeTag = tag;
                console.log('Set active tag \'' + tag + '\' for ' + user.name + '\'s profile.');
                res.json({player: user.name, tags: user.tags, activeTag: user.activeTag});
                return;
            });
        });
    });
}
