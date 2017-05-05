var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftKill = mongoose.model('minecraft_kill');
var verifyServer = require('./verifyServer');

module.exports = function(app) {

    app.post('/mc/player/kill', verifyServer, function(req, res) {
        if(req.body.map) { //rare cases when the map wasn't loaded.
            var kill = new MinecraftKill({
                player: mongoose.Types.ObjectId(req.body.player),
                target: mongoose.Types.ObjectId(req.body.target),

                playerItem: req.body.playerItem,
                targetItem: req.body.targetItem,

                map: mongoose.Types.ObjectId(req.body.map)
            });
            kill.save(function(err) {
                if(err) console.log(err);

                MinecraftUser.update({_id: kill.player}, {$inc: {kills: 1}}, function(err2) {
                    if(err2) console.log(err2);

                    MinecraftUser.update({_id: kill.target}, {$inc: {deaths: 1}}, function(err3) {
                        if(err3) console.log(err3);
                        res.json({});
                    });
                });
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