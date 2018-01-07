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
                    name: server.name,
                    nameLower: server.name.toLowerCase(),
                    
                    playerCount: server.playerCount,
                    spectatorCount: server.spectatorCount,
                    maxPlayers: server.maxPlayers,
                    map: server.map,
                    gameType: server.gameType
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

        var options = {
            url: config.minehut.url + "/server/warzone/heartbeat",
            method: 'POST',
            followAllRedirects: true,
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': config.minehut.auth
            },
            json: {
                heartbeat: {
                    online: true,
                    playerCount: req.body.playerCount + req.body.spectatorCount,
                    timeNoPlayers: 0,
                    players: req.body.players,
                    startedAt: req.body.startedAt,
                    stoppedAt: 0,
                    exited: false
                }
            }
        };
        request(options, function(err, res, body) {
            if(err) console.log(err);
            console.log(body);
        });
    });

};
