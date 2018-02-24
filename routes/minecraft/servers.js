var request = require('request');

var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftServer = mongoose.model('minecraft_server');
var MinecraftMap = mongoose.model('minecraft_map');
var verifyServer = require('./verifyServer');

module.exports = function(app) {
    app.post('/mc/server/stats', function(req, res) {
        MinecraftServer.findOne({
            name: req.body.name
        }, function(err, server) {
            if (server) {
                res.json({
                    _id: server._id,
                    name: 'Warzone',
                    motd: 'Warzone - A Minehut hosted PvP server!',
                    
                    players: server.playerNames,
                    playerCount: server.playerCount,
                    spectatorCount: server.spectatorCount,
                    maxPlayers: server.maxPlayers,

                    lastOnline: server.lastOnline,
                    
                    map: server.map,
                    gametype: server.gametype
                });
            } else {
                res.json({error: "Server not found"});
            }
        });
    });

    app.post('/mc/server/heartbeat', verifyServer, function(req, res) {
        MinecraftServer.findOne({
            name: req.body.name
        }, function(err, server) {
            if(err) throw err;

            // console.log('body: ' + JSON.stringify(req.body, null, 2));

            var data = {
                name: req.body.name,
                nameLower: req.body.name.toLowerCase(),
                id: req.body.id,
                lastOnline: new Date().getTime(),
                players: req.body.players,
                playerNames: req.body.playerNames,
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
