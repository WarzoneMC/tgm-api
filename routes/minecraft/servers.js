var request = require('request');

var mongoose = require("mongoose");
import verifyServer from './verifyServer';
var async = require('async');

import express from 'express';
import { MinecraftUserModel, MinecraftMatchModel, MinecraftDeathModel, MinecraftMapModel, MinecraftPunishmentModel, MinecraftServerModel } from '../../models/minecraft';
const router = express.Router();

router.get('/mc/stats', (req, res, next) => {
    MinecraftUserModel.count({}, (err, users) => {
        MinecraftMatchModel.count({}, (err, matches) => {
            MinecraftDeathModel.count({}, (err, deaths) => {
                MinecraftMapModel.count({}, (err, maps) => {
                    MinecraftPunishmentModel.count({}, (err, punishments) => {
                        res.json({
                            users: users,
                            matches: matches,
                            deaths: deaths,
                            maps: maps,
                            punishments: punishments
                        });
                    })
                })
            })
        })
    })
})

router.post('/mc/server/stats', function (req, res) {
    MinecraftServerModel.findOne({
        name: req.body.name
    }, function (err, server) {
        if (server) {
            res.json({
                _id: server._id,
                name: 'Warzone',
                motd: 'Warzone - A Minehut hosted PvP server!',

                players: server.playerNames,
                playerCount: server.playerCount,
                spectatorCount: server.spectatorCount,
                maxPlayers: server.maxPlayers,

                lastOnline: server.lastOnline,

                map: server.map,
                gametype: server.gametype
            });
        } else {
            res.json({ error: "Server not found" });
        }
    });
});

router.post('/mc/server/heartbeat', verifyServer, function (req, res) {
    MinecraftServerModel.findOne({
        name: req.body.name
    }, function (err, server) {
        if (err) throw err;

        // console.log('body: ' + JSON.stringify(req.body, null, 2));

        var data = {
            name: req.body.name,
            nameLower: req.body.name.toLowerCase(),
            id: req.body.id,
            lastOnline: new Date().getTime(),
            players: req.body.players,
            playerNames: req.body.playerNames,
            playerCount: req.body.playerCount,
            spectatorCount: req.body.spectatorCount,
            maxPlayers: req.body.maxPlayers,
            map: req.body.map,
            gametype: req.body.gametype
        }

        if (!server) {
            server = new MinecraftServerModel(data);
            server.save(function (err) {
                if (err) {
                    console.log(err);
                }
                res.json({});
            })
        } else {
            MinecraftServerModel.updateOne({ name: req.body.name }, { $set: data }, function (err) {
                if (err) {
                    console.log(err);
                }
                res.json({});
            })
        }
    });
});

export default router;