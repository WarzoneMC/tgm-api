var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftServer = mongoose.model('minecraft_server');
var MinecraftMap = mongoose.model('minecraft_map');
var verifyServer = require('./verifyServer');

module.exports = function(app) {
    app.post('/mc/map/load', verifyServer, function(req, res) {
        MinecraftMap.findOne({nameLower: req.body.name.toLowerCase()}, function(err, map) {
            console.log('map body: ' + JSON.stringify(req.body, null, 2));

            if(map) {
                MinecraftMap.updateOne({nameLower: req.body.name.toLowerCase()}, {$set: {
                    version: req.body.version,
                    authors: req.body.authors,
                    name: req.body.name,
                    gametype: req.body.gametype,
                    teams: req.body.teams
                }}, function(err) {
                    if(err) console.log(err);
                    res.json({map: map._id});
                })
            } else {
                map = new MinecraftMap({
                    name: req.body.name,
                    nameLower: req.body.name.toLowerCase(),
                    version: req.body.version,
                    authors: req.body.authors,
                    gametype: req.body.gametype,
                    teams: req.body.teams
                });
                map.save(function(err) {
                    if(err) console.log(err);
                    res.json({inserted: true, map: map._id});
                })
            }
        })
    });

};