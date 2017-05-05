var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftServer = mongoose.model('minecraft_server');
var MinecraftMap = mongoose.model('minecraft_map');
var verifyServer = require('./verifyServer');

module.exports = function(app) {
    app.post('/mc/server/mapload', verifyServer, function(req, res) {
        MinecraftMap.findOne({nameLower: req.body.name.toLowerCase()}, function(err, map) {
            if(map) {
                MinecraftMap.updateOne({nameLower: req.body.name.toLowerCase()}, {$set: {
                    version: req.body.version,
                    authors: req.body.authors,
                    name: req.body.name
                }}, function(err) {
                    if(err) console.log(err);
                    res.json({});
                })
            } else {
                map = new MinecraftMap({
                    name: req.body.name,
                    nameLower: req.body.nameLower,
                    version: req.body.version,
                    authors: req.body.authors
                });
                map.save(function(err) {
                    if(err) console.log(err);
                    res.json({inserted: true});
                })
            }
        })
    });

    app.post('/mc/server/heartbeat', verifyServer, function(req, res) {
        MinecraftServer.findOne({
            name: req.body.name
        }, function(err, server) {
            if(err) throw err;

            console.log('body: ' + JSON.stringify(req.body, null, 2));

            var data = {
                name: req.body.name,
                nameLower: req.body.name.toLowerCase(),
                id: req.body.id,
                lastOnline: new Date().getTime(),
                players: req.body.players,
                playerCount: req.body.playerCount,
                spectatorCount: req.body.spectatorCount,
                maxPlayers: req.body.maxPlayers,
                map: req.body.map,
                gametype: req.body.gametype
            }

            if(!server) {
                server = new MinecraftServer(data);
                server.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                    res.json({});
                })
            } else {
                MinecraftServer.updateOne({name: req.body.name}, {$set: data}, function(err) {
                    if(err) {
                        console.log(err);
                    }
                    res.json({});
                })
            }
        });
    });

};