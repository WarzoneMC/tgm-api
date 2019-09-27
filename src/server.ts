require('dotenv').config();

import * as express from 'express';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as mongoose from 'mongoose';

const app = express();
mongoose.connect(process.env.MONGO_URI || `mongodb://localhost:27017/warzone`, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/mc/players', require('./routes/minecraft/players').default);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Warzone API listening on port', port));
