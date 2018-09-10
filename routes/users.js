const mongoose = require("mongoose");

import express from 'express';
const router = express.Router();

router.get('/', function (req, res) {
    res.send("success!");
});

export default router;
