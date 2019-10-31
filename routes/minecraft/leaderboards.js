var mongoose = require('mongoose');
var MinecraftUser = mongoose.model('minecraft_user');

module.exports = function(app) {

    app.get('/mc/leaderboard/kills', function(req, res, next) {
        var limit;
        if (req.query.limit) {
            try {
                limit = parseInt(req.query.limit);
                if (limit > 25) limit = 25;
            } catch (err) {
                limit = 25;
            }
        } else limit = 25;
        MinecraftUser
            .find({})
            .sort('-kills')
            .limit(limit)
            .exec(function(err, users) {
               if(err) console.log(err);

                res.json(users);
            })
    });
    
    app.get('/mc/leaderboard/xp', function(req, res, next) {
        var limit;
        if (req.query.limit) {
            try {
                limit = parseInt(req.query.limit);
                if (limit > 25) limit = 25;
            } catch (err) {
                limit = 25;
            }
        } else limit = 25;
        MinecraftUser.aggregate([{
            $addFields: {
                xp: {
                    $add: [
                        {$multiply:[{$ifNull:['$wins', 0]}, 10]},
                        {$multiply:[{$ifNull:['$losses', 0]}, 5]},
                        {$multiply:[{$ifNull:['$kills', 0]}, 2]},
                        {$multiply:[{$ifNull:['$wool_destroys', 0]}, 3]}
                    ]
                }
            }
        }])
        .sort('-xp')
        .limit(limit)
        .exec(function(err, users) {
            if(err) console.log(err);
            console.log(users);
            users.forEach(user => {
                user = MinecraftUser.toJSON(user);
            });
            res.json(users);
        })
    });

    app.get('/mc/leaderboard/wins', function(req, res, next) {
        var limit;
        if (req.query.limit) {
            try {
                limit = parseInt(req.query.limit);
                if (limit > 25) limit = 25;
            } catch (err) {
                limit = 25;
            }
        } else limit = 25;
        MinecraftUser
            .find({})
            .sort('-wins')
            .limit(limit)
            .exec(function(err, users) {
               if(err) console.log(err);

                res.json(users);
            })
    });
    
    app.get('/mc/leaderboard/losses', function(req, res, next) {
        var limit;
        if (req.query.limit) {
            try {
                limit = parseInt(req.query.limit);
                if (limit > 25) limit = 25;
            } catch (err) {
                limit = 25;
            }
        } else limit = 25;
        MinecraftUser
            .find({})
            .sort('-losses')
            .limit(limit)
            .exec(function(err, users) {
               if(err) console.log(err);

                res.json(users);
            })
    });

}
