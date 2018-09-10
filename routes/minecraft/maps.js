var mongoose = require("mongoose");
import verifyServer from './verifyServer';

import { MinecraftUserModel, MinecraftMapModel } from "../../models/minecraft";
import express from 'express';
const router = express.Router();

router.post('/mc/map/load', verifyServer, function (req, res) {
    MinecraftMapModel.findOne({ nameLower: req.body.name.toLowerCase() }, function (err, map) {
        console.log('map body: ' + JSON.stringify(req.body, null, 2));

        if (map) {
            MinecraftMapModel.updateOne({ nameLower: req.body.name.toLowerCase() }, {
                $set: {
                    version: req.body.version,
                    authors: req.body.authors,
                    name: req.body.name,
                    gametype: req.body.gametype,
                    teams: req.body.teams
                }
            }, function (err) {
                if (err) console.log(err);
                res.json({ map: map._id });
            })
        } else {
            map = new MinecraftMapModel({
                name: req.body.name,
                nameLower: req.body.name.toLowerCase(),
                version: req.body.version,
                authors: req.body.authors,
                gametype: req.body.gametype,
                teams: req.body.teams
            });
            map.save(function (err) {
                if (err) console.log(err);
                res.json({ inserted: true, map: map._id });
            })
        }
    })
});

export default router;