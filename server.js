const express = require('express');
config = require('./config.json');
const app = express();
Common = require('./util/common');

var mongoose = require('mongoose');
mongoose.connect(config.mongo, { useMongoClient: true });

//models
require('./models/global.js');
require('./models/minecraft.js');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('morgan')('dev'));

app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
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

const port = process.env.PORT || config.port || 3000;
app.listen(port, () => console.log('API server started on port ' + port));
