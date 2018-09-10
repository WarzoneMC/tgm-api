var mongoose = require("mongoose");

import express from 'express';
import { MinecraftUserModel } from "../../models/minecraft";
const router = express.Router();

router.get('/mc/leaderboard/kills', function(req, res, next) {
    MinecraftUserModel
        .find({})
        .sort("-kills")
        .limit(25)
        .exec(function(err, users) {
            if(err) console.log(err);

            res.json(users);
        })
});

export default router;