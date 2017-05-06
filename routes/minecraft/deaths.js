var mongoose = require("mongoose");
var verifyServer = require('./verifyServer');
var async = require('async');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var MinecraftMatch = mongoose.model('minecraft_match');

module.exports = function(app) {

    var matchPlayerWithId = function(players, id, callback) {
        if(id == null) {
            return callback(null);
        }
        async.eachSeries(players, function(player, next) {
            if(player._id.toString() == id.toString()) {
                console.log('found player [' + player.name + ']')
                callback(player);
            } else {
                next();
            }
        }, function(err) {
            callback(null);
        })
    }

    app.get('/mc/deaths/latest', function(req, res) {
        MinecraftDeath
            .find({})
            .sort('-date')
            .limit(4)
            .exec(function(err, foundDeaths) {
                if(err) {
                    console.log(err);
                }
                var containing = new Array();
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
                            res.json(foundDeaths);
                        })
                    })
                })
            })
    })



}