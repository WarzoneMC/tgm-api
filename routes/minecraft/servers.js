var request = require('request');

var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftServer = mongoose.model('minecraft_server');
var MinecraftMap = mongoose.model('minecraft_map');
var verifyServer = require('./verifyServer');

module.exports = function(app) {
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

        var array = new Array();
        array.push({
            ip: "teamgg",
            port: 1,
            _id: req.body.id,
            name: "TeamGG",
            motd: "Team.gg - Team PvP Combat",
            rank: "DIAMOND",
            player_count: req.body.playerCount + req.body.spectatorCount,
            max_players: req.body.maxPlayers
        });

        var options = {
            url: config.minehut.url + "/servers/heartbeat",
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': config.minehut.auth
            },
            json: {
                servers: array
            }
        };
        request(options, function(err, res, body) {
            if(err) console.log(err);
            console.log(body);
        });
    });

};