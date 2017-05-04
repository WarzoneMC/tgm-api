var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftServer = mongoose.model('minecraft_server');
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
                MinecraftServer.updateOne({name: req.query.name}, {$set: data}, function(err) {
                    res.json({});
                })
            }
        });
    });

}