let mongoose = require("mongoose");
let verifyServer = require('./verifyServer');
let async = require('async');

let MinecraftUser = mongoose.model('minecraft_user');
let MinecraftDeath = mongoose.model('minecraft_death');
let MinecraftMatch = mongoose.model('minecraft_match');
let MinecraftRank = mongoose.model('minecraft_rank');

module.exports = function (app) {

    app.get('/mc/ranks', verifyServer, (req, res) => {
        MinecraftRank.find({}, (err, ranks) => {
            res.json({ ranks: ranks });
        })
    })

    /**
     * Probably won't be used since ranks are cached in player objects
     * in TGM.
     */
    app.get('/mc/player/:name/ranks', verifyServer, (req, res) => {
        MinecraftUser.findOne({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
            if (!user) {
                res.status(401).json({ error: "User not found", userNotFound: true });
                return;
            }

            res.json({ ranks: user.ranks });
        })
    })

    /**
     * Adds a rank to a user's profile
     *
     * Post Body:
     *  - rank: String (Object Id)
     */
    app.post('/mc/player/:name/rank/add', verifyServer, (req, res) => {
        if (!req.body.rank) {
            res.status(401).json({ error: "Rank not included in request.", rankNotFound: true });
            return;
        }

        let userId = new mongoose.Types.ObjectId(req.body.rank);
        MinecraftRank.find({ _id: userId }, (err, rank) => {
            if (!rank) {
                console.log('rank not found: ' + req.body.rank);
                res.status(401).json({ error: "Rank not found", rankNotFound: true });
                return;
            }

            MinecraftUser.find({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
                if (!user) {
                    console.log('player not found: ' + req.params.name);
                    res.status(401).json({ error: "Player not found", userNotFound: true });
                    return;
                }

                //user already has rank
                if (user.ranks && user.ranks.indexOf(userId) > -1) {
                    res.json({});
                    return;
                }

                MinecraftUser.update({ _id: userId }, {
                    $addToSet: { ranks: rank._id }
                }, (err) => {
                    console.log('Added rank ' + rank.prefix + ' to ' + user.name + '\'s profile.');
                    res.json({});
                    return;
                })
            })
        })
    })

    /**
     * Removes a rank from a user's profile
     *
     * Post Body:
     *  - rank: String (Object Id)
     */
    app.post('/mc/player/:name/rank/remove', verifyServer, (req, res) => {
        if (!req.body.rank) {
            res.status(401).json({ error: "Rank not included in request.", rankNotFound: true });
            return;
        }

        let userId = new mongoose.Types.ObjectId(req.body.rank);
        MinecraftRank.find({ _id: userId }, (err, rank) => {
            if (!rank) {
                console.log('rank not found: ' + req.body.rank);
                res.status(401).json({ error: "Rank not found", rankNotFound: true });
                return;
            }

            MinecraftUser.find({ nameLower: req.params.name.toLowerCase() }, (err, user) => {
                if (!user) {
                    console.log('player not found: ' + req.params.name);
                    res.status(401).json({ error: "Player not found", userNotFound: true });
                    return;
                }

                //user already doesn't have rank
                if (user.ranks && user.ranks.indexOf(userId) <= -1) {
                    res.json({});
                    return;
                }

                MinecraftUser.update({ _id: userId }, {
                    $pull: { ranks: rank._id }
                }, (err) => {
                    console.log('Removed rank ' + rank.prefix + ' to ' + user.name + '\'s profile.');
                    res.json({});
                    return;
                })
            })
        })
    })
}