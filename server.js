import express from 'express';
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
mongoose.Promise = global.Promise;

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/teamgg';
console.log('Connecting to mongo at ' + mongoUrl);
mongoose.connect(mongoUrl, { useMongoClient: true }).then(() => {
    console.log('Successfully connected to mongo.');
}, err => {
    console.error('Failed to connect to mongo:', err);
    process.exit(1);
});

// models
import './models/global.js';
import './models/minecraft.js';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

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

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

const port = process.env.PORT || 3000;
app.listen(port);

console.log('API server started on port ' + port);