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