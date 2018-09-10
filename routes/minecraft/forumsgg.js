var mongoose = require("mongoose");

import express from 'express';
import { MinecraftUserModel } from "../../models/minecraft";
const router = express.Router();

router.post('/forumsgg/stats', function (req, res, next) {
    if (!req.body.mcUuid) {
        console.log('Incomplete ForumsGG stat request');
        res.json({ error: true, message: "Missing field: mcUuid" });
        return;
    }
    var uuid = req.body.mcUuid.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, "$1-$2-$3-$4-$5");
    MinecraftUserModel.findOne({ uuid: uuid }, function (err, user) {
        if (user) {
            var userObj = user.toJSON()
            var monument_destroys = userObj.wool_destroys ? userObj.wool_destroys : 0;
            var kills = userObj.kills ? userObj.kills : 0;
            var deaths = userObj.deaths ? userObj.deaths : 0;
            var wins = userObj.wins ? userObj.wins : 0;
            var losses = userObj.losses ? userObj.losses : 0;

            res.json(getStatBoxes(userObj.level, userObj.matches.length, monument_destroys, kills, deaths, wins, losses));
        } else {
            res.json(getStatBoxes(1, 0, 0, 0, 0, 0, 0));
        }
    });
});

function getStatBoxes(level, matches, monument_destroys, kills, deaths, wins, losses) {
    if (deaths == 0) kdr = (kills / 1).toFixed(2);
    else kdr = (kills / deaths).toFixed(2);

    if (losses == 0) wlr = (wins / 1).toFixed(2);
    else wlr = (wins / losses).toFixed(2);

    return {
        displayType: "stat-boxes",
        statEntries: [
            { name: "Level", value: level },
            { name: "Matches", value: matches },
            { name: "Monument Destroys", value: monument_destroys },
            { name: "Kills", value: kills },
            { name: "Deaths", value: deaths },
            { name: "K/D", value: kdr },
            { name: "Wins", value: wins },
            { name: "Losses", value: losses },
            { name: "W/L", value: wlr }
        ]
    };
}

export default router;