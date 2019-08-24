require('dotenv').config();

const express = require('express');
const rethinkdbdash = require('rethinkdbdash');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const r = (module.exports.r = rethinkdbdash({
	db: process.env.DATABASE_NAME || 'warzone'
}));

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/mc/players', require('./routes/minecraft/players'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Warzone API listening on port', port));
