const express = require('express');
config = require('./config.json');
const bodyParser = require('body-parser');
var logger = require('morgan');
const app = express();
Common = require('./util/common');

var mongoose = require('mongoose');
mongoose.connect(config.mongo);

//models
require('./models/global.js');
require('./models/minecraft.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

/** load routes*/
require('./routes/minecraft/players')(app);
require('./routes/minecraft/servers')(app);
require('./routes/minecraft/maps')(app);
require('./routes/minecraft/leaderboards')(app);
require('./routes/minecraft/matches')(app);
require('./routes/minecraft/deaths')(app);
require('./routes/minecraft/ranks')(app);
require('./routes/minecraft/punishments')(app);
require('./routes/minecraft/forumsgg')(app);

const port = config.port;

app.listen(process.env.PORT || port);

console.log('API server started on port ' + port);