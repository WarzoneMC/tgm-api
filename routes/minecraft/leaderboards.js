var mongoose = require("mongoose");
var User = mongoose.model('user');
var MinecraftUser = mongoose.model('minecraft_user');
var MinecraftDeath = mongoose.model('minecraft_death');
var verifyServer = require('./verifyServer');

module.exports = function(app) {

    app.get('/mc/leaderboard/kills', function(req, res, next) {
        console.log('kills leaderboard request.');
        MinecraftUser
            .find({})
            .sort("-kills")
            .limit(25)
            .exec(function(err, users) {
               if(err) console.log(err);

                res.json(users);
            })
    });

}