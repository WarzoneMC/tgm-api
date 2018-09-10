let mongoose = require("mongoose");
import verifyServer from './verifyServer';
let async = require('async');

import express from 'express';
import { MinecraftRankModel, MinecraftUserModel } from "../../models/minecraft";
const router = express.Router();

router.get('/mc/ranks', (req, res) => {
    MinecraftRankModel.find({}).sort('priority').exec((err, ranks) => {
        res.json(ranks);
    })
});

router.get('/mc/rank/:rank/players', (req, res) => {
    MinecraftRankModel.findOne({ name: req.params.rank.toLowerCase() }, (err, rank) => {
        if (!rank) {
            res.status(404).json({ notFound: true });
            return;
        }
        MinecraftUserModel.find({ ranks: rank._id }).exec((err, users) => {
            res.json({
                rank: rank,
                users: users
            });
        });
    });
});

router.get('/mc/player/:name/ranks', verifyServer, (req, res) => {
    MinecraftUserModel.find({ nameLower: req.params.name.toLowerCase() }).sort("-lastOnlineDate").limit(1).exec((err, users) => {
        var user = users[0];
        if (!user) {
            res.status(404).json({ notFound: true });
            return;
        }
        MinecraftRankModel.find({ _id: { $in: user.ranks } }, (err, ranks) => {
            res.json(ranks);
        });
    });
});

router.post('/mc/rank/create', verifyServer, (req, res) => {
    if (!req.body.name) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }
    var rank = new MinecraftRankModel({
        name: req.body.name.toLowerCase(),
        priority: req.body.priority,
        prefix: req.body.prefix,
        permissions: req.body.permissions,
        staff: req.body.staff
    });
    rank.save(function (err) {
        if (err) {
            console.log(err);
        }
        res.json({ rank: rank });
        console.log('Registered new minecraft rank: ' + rank.name);
    })
});

router.post('/mc/rank/delete', verifyServer, (req, res) => {
    if (!req.body.name && !req.body._id) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }
    if (req.body._id) {
        MinecraftRankModel.findOne({ _id: req.body._id }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            MinecraftRankModel.remove({ _id: req.body._id }, (err, obj) => {
                console.log("Deleted rank " + rank.name);
                res.json({ rank: rank });
            });
        });

    } else if (req.body.name) {
        MinecraftRankModel.findOne({ name: req.body.name.toLowerCase() }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            MinecraftRank.remove({ name: req.body.name }, (err, obj) => {
                console.log("Deleted rank " + rank.name);
                res.json({ rank: rank });
            });
        });
    }
});

router.post('/mc/rank/set/:field', verifyServer, (req, res) => {
    if (!req.body.name && !req.body._id && req.body.value) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }
    if (req.body._id) {
        MinecraftRankModel.findOne({ _id: req.body._id }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            var update = {};
            if (req.params.field == "prefix") update.prefix = req.body.value;
            if (req.params.field == "priority") update.priority = req.body.value;
            if (req.params.field == "permissions") update.permissions = req.body.value;
            if (req.params.field == "staff") update.staff = req.body.value;

            console.log(update);

            MinecraftRankModel.findOneAndUpdate({ _id: req.body._id }, { $set: update }, {}, (err, newRank) => {
                console.log("Edited rank " + newRank.name);
                res.json({ rank: newRank });
            });
        });

    } else if (req.body.name) {
        MinecraftRankModel.findOne({ name: req.body.name.toLowerCase() }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            var update = {};
            if (req.params.field == "prefix") update.prefix = req.body.value;
            if (req.params.field == "priority") update.priority = req.body.value;
            if (req.params.field == "permissions") update.permissions = req.body.value;
            if (req.params.field == "staff") update.staff = req.body.value;

            console.log(update);

            MinecraftRankModel.update({ name: req.body.name.toLowerCase() }, { $set: update }, (err) => {
                for (i in update) {
                    rank[i] = update[i];
                }
                console.log("Edited rank " + rank.name);
                res.json({ rank: rank });
            });
        });
    }
});

router.post('/mc/rank/permissions/add', verifyServer, (req, res) => {
    if (!req.body.name && !req.body._id) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }
    if (!req.body.permissions || !(req.body.permissions instanceof Array)) {
        res.status(400).json({ message: "Rank permissions not specified.", error: true });
        return;
    }
    if (req.body._id) {
        MinecraftRankModel.findOne({ _id: req.body._id }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            var permissions = (rank.permissions ? rank.permissions : new Array());
            for (var i in req.body.permissions) {
                var permission = req.body.permissions[i];
                if (permissions.indexOf(permission) <= -1) {
                    permissions.push(permission);
                }
            }
            MinecraftRank.update({ name: req.body._id }, { $set: { permissions: permissions } }, (err) => {
                console.log("Added permissions to rank " + rank.name + ": " + req.body.permissions);
                res.json({ rank: rank });
            });
        });

    } else if (req.body.name) {
        MinecraftRankModel.findOne({ name: req.body.name.toLowerCase() }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            var permissions = (rank.permissions ? rank.permissions : new Array());
            for (var i in req.body.permissions) {
                var permission = req.body.permissions[i];
                if (permissions.indexOf(permission) <= -1) {
                    permissions.push(permission);
                }
            }
            MinecraftRankModel.update({ name: req.body.name.toLowerCase() }, { $set: { permissions: permissions } }, (err) => {

                console.log("Added permissions to rank " + rank.name + ": " + req.body.permissions);
                res.json({ rank: rank });
            });
        });
    }
});

router.post('/mc/rank/permissions/remove', verifyServer, (req, res) => {
    if (!req.body.name && !req.body._id) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }
    if (!req.body.permissions || !(req.body.permissions instanceof Array)) {
        res.status(400).json({ message: "Rank permissions not specified.", error: true });
        return;
    }
    if (req.body._id) {
        MinecraftRankModel.findOne({ _id: req.body._id }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            for (var i in req.body.permissions) {
                var permission = req.body.permissions[i];
                if (rank.permissions && rank.permissions.indexOf(permission) > -1) {
                    rank.permissions.splice(i, 1);
                }
            }
            MinecraftRankModel.update({ name: req.body._id }, { $set: { permissions: rank.permissions } }, (err) => {
                console.log("Removed permissions from rank " + rank.name + ": " + req.body.permissions);
                res.json({ rank: rank });
            });
        });

    } else if (req.body.name) {
        MinecraftRankModel.findOne({ name: req.body.name.toLowerCase() }, (err, rank) => {
            if (!rank) {
                res.json({ message: "Rank not found", error: true });
                return;
            }
            for (var i in req.body.permissions) {
                var permission = req.body.permissions[i];
                if (rank.permissions && rank.permissions.indexOf(permission) > -1) {
                    rank.permissions.splice(rank.permissions.indexOf(permission), 1);
                }
            }
            MinecraftRankModel.update({ name: req.body.name.toLowerCase() }, { $set: { permissions: rank.permissions } }, (err) => {

                console.log("Removed permissions from rank " + rank.name + ": " + req.body.permissions);
                res.json({ rank: rank });
            });
        });
    }
});

/**
 * Adds a rank to a user's profile
 *
 * Post Body:
 *  - rankId: String (Object Id)
 *  - rankName: String (You may use this instead of rankId)
 */
router.post('/mc/player/:name/rank/add', verifyServer, (req, res) => {
    if (!req.body.rankId && !req.body.rankName) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }
    var filter = {};
    if (req.params.name.length >= 36) {
        filter = { uuid: req.params.name };
    } else {
        filter = { nameLower: req.params.name.toLowerCase() };
    }
    MinecraftUserModel.findOne(filter, (err, user) => {
        if (!user) {
            console.log('player not found: ' + req.params.name);
            res.status(401).json({ message: "Player not found", error: true });
            return;
        }
        if (req.body.rankId) {
            let rankId = new mongoose.Types.ObjectId(req.body.rankId);
            //user already has rank
            if (user.ranks && user.ranks.indexOf(rankId) > -1) {
                res.status(400).json({ message: "User already has the specified rank", error: true });
                return;
            }

            MinecraftRankModel.findOne({ _id: rankId }, (err, rank) => {
                if (!rank) {
                    console.log('rank not found: ' + req.body.rankId);
                    res.status(404).json({ message: "Rank not found", error: true });
                    return;
                }

                MinecraftUserModel.update({ _id: user._id }, {
                    $addToSet: { ranks: rank._id }
                }, (err) => {
                    console.log('Added rank ' + rank.name + ' to ' + user.name + '\'s profile.');
                    res.json({ rank: rank });
                    return;
                });
            });
        } else if (req.body.rankName) {

            let rankName = req.body.rankName.toLowerCase();
            MinecraftRankModel.findOne({ name: rankName }, (err, rank) => {
                if (!rank) {
                    console.log('rank not found: ' + rankName);
                    res.status(404).json({ message: "Rank not found", error: true });
                    return;
                }

                //user already has rank
                if (user.ranks && user.ranks.indexOf(rank._id) > -1) {
                    res.status(400).json({ message: "User already has the specified rank", error: true });
                    return;
                }

                console.log(rank);

                MinecraftUserModel.update({ _id: user._id }, {
                    $addToSet: { ranks: rank._id }
                }, (err) => {
                    console.log(user._id + ": " + rank._id)
                    console.log('Added rank ' + rank.name + ' to ' + user.name + '\'s profile.');
                    res.json({ rank: rank });
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
    *  - rankId: String (Object Id)
    *  - rankName: String (You may use this instead of rankId)
    */
router.post('/mc/player/:name/rank/remove', verifyServer, (req, res) => {
    if (!req.body.rankId && !req.body.rankName) {
        res.status(400).json({ message: "Rank not included in request.", error: true });
        return;
    }

    var filter = {};
    if (req.params.name.length >= 36) {
        filter = { uuid: req.params.name };
    } else {
        filter = { nameLower: req.params.name.toLowerCase() };
    }

    MinecraftUserModel.findOne(filter, (err, user) => {
        if (!user) {
            console.log('player not found: ' + req.params.name);
            res.status(404).json({ message: "Player not found", error: true });
            return;
        }
        if (req.body.rankId) {
            let rankId = new mongoose.Types.ObjectId(req.body.rankID);
            MinecraftUserModel.findOne({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
                if (!user) {
                    console.log('player not found: ' + req.params.name);
                    res.status(404).json({ error: "Player not found", error: true });
                    return;
                }
                MinecraftRankModel.findOne({ _id: rankId }, (err, rank) => {
                    /*if (!rank) {
                        console.log('rank not found: ' + req.body.rank);
                        res.status(404).json({ message: "Rank not found", error: true });
                        return;
                    }*/
                    //user already doesn't have rank
                    if (user.ranks && user.ranks.indexOf(rankId) <= -1) {
                        res.status(400).json({ message: "User did not have the specified rank", error: true });
                        return;
                    }

                    MinecraftUser.update({ _id: user._id }, {
                        $pull: { ranks: rank._id }
                    }, (err) => {
                        console.log('Removed rank ' + (rank ? rank.name : rankId.toString()) + ' from ' + user.name + '\'s profile.');
                        res.json({ rank: rank });
                        return;
                    })
                })
            })
        } else if (req.body.rankName) {
            let rankName = req.body.rankName.toLowerCase();
            MinecraftRankModel.findOne({ name: rankName }, (err, rank) => {
                if (!rank) {
                    console.log('rank not found: ' + rankName);
                    res.status(404).json({ message: "Rank not found", error: true });
                    return;
                }

                //user already doesn't have rank
                if (user.ranks && user.ranks.indexOf(rank._id) <= -1) {
                    res.status(400).json({ message: "User did not have the specified rank", error: true });
                    return;
                }

                console.log(rank);

                MinecraftUserModel.update({ _id: user._id }, {
                    $pull: { ranks: rank._id }
                }, (err) => {
                    console.log(user._id + ": " + rank._id)
                    console.log('Removed rank ' + rank.name + ' from ' + user.name + '\'s profile.');
                    res.json({ rank: rank });
                    return;
                });
            });
        }
    });
})

export default router;
