import express from 'express';
import config from './config';
import bodyParser from 'body-parser';
import logger from 'morgan';

// routes
import playerRoutes from './routes/minecraft/players';
import serverRoutes from './routes/minecraft/servers';
import mapRoutes from './routes/minecraft/maps';
import leaderboardRoutes from './routes/minecraft/leaderboards';
import matchRoutes from './routes/minecraft/matches';
import deathRoutes from './routes/minecraft/deaths';
import rankRoutes from './routes/minecraft/ranks';
import punishmentRoutes from './routes/minecraft/punishments';
import forumsRoutes from './routes/minecraft/forumsgg';

const app = express();

import mongoose from 'mongoose';
mongoose.connect(config.mongo, { useMongoClient: true });
mongoose.Promise = global.Promise;

// models
import './models/global.js';
import './models/minecraft.js';

// initialize routes
app.use('/', playerRoutes);
app.use('/', serverRoutes);
app.use('/', mapRoutes);
app.use('/', leaderboardRoutes);
app.use('/', matchRoutes);
app.use('/', deathRoutes);
app.use('/', rankRoutes);
app.use('/', punishmentRoutes);
app.use('/', forumsRoutes);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

const port = config.port;

app.listen(process.env.PORT || port);

console.log('API server started on port ' + port);