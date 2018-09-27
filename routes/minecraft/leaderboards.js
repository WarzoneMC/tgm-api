var mongoose = require('mongoose');
var MinecraftUser = mongoose.model('minecraft_user');

module.exports = function(app) {

    app.get('/mc/leaderboard/kills', function(req, res, next) {
        MinecraftUser
            .find({})
            .sort('-kills')
            .limit(25)
            .exec(function(err, users) {
               if(err) console.log(err);

                res.json(users);
            })
    });

}