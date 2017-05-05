var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var verifyServer = require('./verifyServer');

module.exports = function(app) {

    app.post('/mc/player/death', verifyServer, function(req, res) {
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

                map: mongoose.Types.ObjectId(req.body.map)
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
                }

                res.json({});
            });
        }
    });

    app.post('/mc/player/login', verifyServer, function(req, res) {
        console.log('login request');
        MinecraftUser.findOne({
            uuid: req.body.uuid
        }, function(err, user) {
            if(err) throw err;
            console.log('body: ' + JSON.stringify(req.body, null, 2));

            if(user) {
                var ips = user.ips;
                if(ips.indexOf(req.body.ip) < 0) {
                    ips.push(req.body.ip);
                }
                MinecraftUser.update({uuid: req.body.uuid}, {$set: {
                    name: req.body.name,
                    nameLower: req.body.name.toLowerCase(),
                    lastOnlineDate: new Date().getTime(),
                    ips: ips
                }}, function(err) {
                    res.json(user);
                    console.log('user: ' + JSON.stringify(user, null, 2));
                    console.log('Minecraft User login: ' + user.name);
                });
            } else {
                user = new MinecraftUser({
                    name: req.body.name,
                    nameLower: req.body.name.toLowerCase(),
                    uuid: req.body.uuid,

                    initialJoinDate: new Date().getTime(),
                    lastOnlineDate: new Date().getTime(),

                    ranks: [],
                    ips: [req.body.ip]
                });
                user.save(function(err) {
                    if(err) {
                        console.log(err);
                    }
                    res.json(user);
                    console.log('Registered new minecraft user: ' + user.name);
                })
            }
        });
    });

}