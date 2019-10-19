require('dotenv').config();

import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as mongoose from 'mongoose';

import { MONGO_URI, PORT } from './constants';

const app = express();
mongoose.connect(process.env.MONGO_URI || MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}, (err) => {
	if (err) {
		console.log("Could not connect to database: ", err);
		process.exit();
	}
	else console.log("Connected to database");
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/mc/players', require('./routes/minecraft/players').default);

const port = process.env.PORT || PORT;
app.listen(port, () => console.log('TGM API listening on port', port));
