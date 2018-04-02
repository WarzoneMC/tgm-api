var mongoose = require("mongoose");
var MinecraftUser = mongoose.model('minecraft_user');

module.exports = function(app) {

    app.post('/forumsgg/stats', function(req, res, next) {
        if (!req.body.mcUuid) {
            console.log('Incomplete ForumsGG stat request');
            res.json({error: true, message: "Missing field: mcUuid"});
            return;
        }
        var uuid = req.body.mcUuid.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, "$1-$2-$3-$4-$5");
        MinecraftUser.findOne({uuid: uuid}, function(err, user) {
            if (user) {
                var kills = (user.kills ? user.kills : 0);
                var deaths = (user.deaths ? user.deaths : 0);
                var wins = (user.wins ? user.wins : 0);
                var losses = (user.losses ? user.losses : 0);
                
                res.json(getStatBoxes(kills, deaths, wins, losses));
            } else {
                res.json(getStatBoxes(0,0,0,0));
            }
        });
    });

    function getStatBoxes(kills, deaths, wins, losses) {
        if (deaths == 0) kdr = (kills / 1).toFixed(2);
        else kdr = (kills / deaths).toFixed(2);

        if (losses == 0) wlr = (wins / 1).toFixed(2);
        else wlr = (wins / losses).toFixed(2);

        return {
            displayType: "stat-boxes",
            statEntries: [
                {name: "Kills", value: kills},
                {name: "Deaths", value: deaths},
                {name: "K/D", value: kdr},
                {name: "Wins", value: wins},
                {name: "Losses", value: losses},
                {name: "W/L", value: wlr}
            ]
        };
    }

}