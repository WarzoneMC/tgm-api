let mongoose = require("mongoose");
let verifyServer = require('./verifyServer');
let async = require('async');

let MinecraftUser = mongoose.model('minecraft_user');
let MinecraftRank = mongoose.model('minecraft_rank');

module.exports = function (app) {

    app.get('/mc/ranks', verifyServer, (req, res) => {
        MinecraftRank.find({}, (err, ranks) => {
            res.json(ranks);
        })
    })

    app.get('/mc/player/:name/ranks', verifyServer, (req, res) => {
        MinecraftUser.find({ nameLower: req.params.name.toLowerCase() }).sort("-lastOnlineDate").limit(1).exec((err, user) => {
            if (!user) {
                res.status(401).json({ notFound: true });
                return;
            }

            res.json({ ranks: user.ranks });
        });
    })

    /**
     * Adds a rank to a user's profile
     *
     * Post Body:
     *  - rankId: String (Object Id)
     *  - rankName: String (You may use this instead of rankId)
     */
    app.post('/mc/player/:name/rank/add', verifyServer, (req, res) => {
        if (!req.body.rankId && !req.body.rankName) {
            res.status(401).json({ message: "Rank not included in request.", error: true });
            return;
        }

        MinecraftUser.findOne({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
            if (!user) {
                console.log('player not found: ' + req.params.name);
                res.status(401).json({ message: "Player not found", error: true });
                return;
            }
            if (req.body.rankId) {
                let rankId = new mongoose.Types.ObjectId(req.body.rankId);
                //user already has rank
                if (user.ranks && user.ranks.indexOf(rankId) > -1) {
                    res.status(401).json({ message: "User already has the specified rank", error: true });
                    return;
                }

                MinecraftRank.findOne({ _id: rankId }, (err, rank) => {
                    if (!rank) {
                        console.log('rank not found: ' + req.body.rankId);
                        res.status(401).json({ message: "Rank not found", error: true });
                        return;
                    }

                    MinecraftUser.update({ _id: user._id }, {
                        $addToSet: { ranks: rank._id }
                    }, (err) => {
                        console.log('Added rank ' + rank.name + ' to ' + user.name + '\'s profile.');
                        res.json({rank: rank});
                        return;
                    });
                });
            } else if (req.body.rankName) {
                               
                let rankName = req.body.rankName;
                MinecraftRank.findOne({ name: rankName }, (err, rank) => {
                    if (!rank) {
                        console.log('rank not found: ' + rankName);
                        res.status(401).json({ message: "Rank not found", error: true });
                        return;
                    }

                    //user already has rank
                    if (user.ranks && user.ranks.indexOf(rank._id) > -1) {
                        res.status(401).json({ message: "User already has the specified rank", error: true });
                        return;
                    }

                    console.log(rank);

                    MinecraftUser.update({ _id: user._id }, {
                        $addToSet: { ranks: rank._id }
                    }, (err) => {
                        console.log(user._id + ": " + rank._id)
                        console.log('Added rank ' + rank.name + ' to ' + user.name + '\'s profile.');
                        res.json({rank: rank});
                        return;
                    });
                });
            }
        });
    });

    /**
     * Removes a rank from a user's profile
     *
     * Post Body:
     *  - rank: String (Object Id)
     */
    app.post('/mc/player/:name/rank/remove', verifyServer, (req, res) => {
        if (!req.body.rankId && !req.body.rankName) {
            res.status(401).json({ message: "Rank not included in request.", error: true });
            return;
        }

        MinecraftUser.findOne({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
            if (!user) {
                console.log('player not found: ' + req.params.name);
                res.status(401).json({ message: "Player not found", error: true });
                return;
            }
            if (req.body.rankId) {
                let rankId = new mongoose.Types.ObjectId(req.body.rankID);
                MinecraftUser.findOne({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
                    if (!user) {
                        console.log('player not found: ' + req.params.name);
                        res.status(401).json({ error: "Player not found", error: true });
                        return;
                    }
                    MinecraftRank.findOne({ _id: rankId }, (err, rank) => {
                        /*if (!rank) {
                            console.log('rank not found: ' + req.body.rank);
                            res.status(401).json({ message: "Rank not found", error: true });
                            return;
                        }*/
                        //user already doesn't have rank
                        if (user.ranks && user.ranks.indexOf(rankId) <= -1) {
                            res.status(401).json({ message: "User did not have the specified rank", error: true });
                            return;
                        }

                        MinecraftUser.update({ _id: user._id }, {
                            $pull: { ranks: rank._id }
                        }, (err) => {
                            console.log('Removed rank ' + (rank ? rank.name : rankId.toString()) + ' from ' + user.name + '\'s profile.');
                            res.json({rank: rank});
                            return;
                        })
                    })
                })
            } else if (req.body.rankName) {
                let rankName = req.body.rankName;
                MinecraftRank.findOne({ name: rankName }, (err, rank) => {
                    if (!rank) {
                        console.log('rank not found: ' + rankName);
                        res.status(401).json({ message: "Rank not found", error: true });
                        return;
                    }

                    //user already doesn't have rank
                    if (user.ranks && user.ranks.indexOf(rank._id) <= -1) {
                        res.status(401).json({ message: "User did not have the specified rank", error: true });
                        return;
                    }

                    console.log(rank);

                    MinecraftUser.update({ _id: user._id }, {
                        $pull: { ranks: rank._id }
                    }, (err) => {
                        console.log(user._id + ": " + rank._id)
                        console.log('Added rank ' + rank.name + ' to ' + user.name + '\'s profile.');
                        res.json({rank: rank});
                        return;
                    });
                });         
            }
        });


        let rankId = new mongoose.Types.ObjectId(req.body.rank);
        MinecraftRank.findOne({ _id: rankId }, (err, rank) => {
            if (!rank) {
                console.log('rank not found: ' + req.body.rank);
                res.status(401).json({ error: "Rank not found", rankNotFound: true });
                return;
            }

            MinecraftUser.findOne({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
                if (!user) {
                    console.log('player not found: ' + req.params.name);
                    res.status(401).json({ error: "Player not found", userNotFound: true });
                    return;
                }

                //user already doesn't have rank
                if (user.ranks && user.ranks.indexOf(rankId) <= -1) {
                    res.json({});
                    return;
                }

                MinecraftUser.update({ _id: user._id }, {
                    $pull: { ranks: rank._id }
                }, (err) => {
                    console.log('Removed rank ' + rank.prefix + ' from ' + user.name + '\'s profile.');
                    res.json({});
                    return;
                })
            })
        })
    })
}