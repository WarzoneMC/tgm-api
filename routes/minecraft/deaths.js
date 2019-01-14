var mongoose = require('mongoose');
var verifyServer = require('./verifyServer');
var async = require('async');

var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');

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

    app.get('/mc/death/latest', function(req, res) {
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

    /**
     * body: Death.java
     */
    app.post('/mc/death/new', verifyServer, function(req, res) {
        console.log('death body: ' + JSON.stringify(req.body, null, 2));

        if(req.body.map) { //rare cases when the map wasn't loaded.
            killerId = null;
            if(req.body.killer) {
                killerId = mongoose.Types.ObjectId(req.body.killer);
            }

            var death = new MinecraftDeath({
                player: mongoose.Types.ObjectId(req.body.player),
                killer: killerId,

                playerItem: req.body.playerItem,
                killerItem: req.body.killerItem,

                map: mongoose.Types.ObjectId(req.body.map),
                date: new Date().getTime(),
                match: mongoose.Types.ObjectId(req.body.match)
            });
            death.save(function(err) {
                if(err) console.log(err);

                if(death.player) {
                    MinecraftUser.update({_id: death.player}, {$inc: {deaths: 1}}, function(err2) {
                        if(err2) console.log(err2);
                    });
                }

                if(death.killer) {
                    MinecraftUser.update({_id: death.killer}, {$inc: {kills: 1}}, function(err3) {
                        if(err3) console.log(err3);
                    });
                    if(req.body.firstBlood) {
                        MinecraftUser.update({_id: death.killer}, {$inc: {firstBloods: 1}}, function(err4) {
                            if(err4) console.log(err4);
                        });
                    }
                }

                res.json({});
            });
        } else {
            console.log('death did not contain map');
            res.json({error: true})
        }
    });


}