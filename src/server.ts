require('dotenv').config();

import * as express from 'express';
import * as rethinkdbdash from 'rethinkdbdash';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as cors from 'cors';

const app = express();
export const r = rethinkdbdash({ db: process.env.DATABASE_NAME || 'warzone' });

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/mc/players', require('./routes/minecraft/players').default);
app.use('/api/mc/deaths', require('./routes/minecraft/deaths').default);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Warzone API listening on port', port));
