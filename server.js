const express = require('express');
const config = require('./config.json');
const bodyParser = require('body-parser');
var logger = require('morgan');
const app = express();

var mongoose = require('mongoose');
mongoose.connect(config.mongo);

//models
require('./models/global.js');
require('./models/minecraft.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

/** load routes*/
require('./routes/users')(app);

const port = config.port;

app.listen(process.env.PORT || port);

console.log('API server started on port ' + port);