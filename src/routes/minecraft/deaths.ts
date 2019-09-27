import * as express from 'express';
import { Request, Response } from 'express';
import { r } from '../../server';
import { isAuthenticated, handleJoi } from '../../util';
import newDeath from '../../schemas/request/newDeath';

const router = express.Router();

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
	// When player dies
	if (!handleJoi(newDeath, req, res)) return;
	console.log('death body: ' + JSON.stringify(req.body));

	await r.table('deaths').insert({
		victim: req.body.victim,
		attacker: req.body.attacker,
		victimItem: req.body.victimItem,
		attackerItem: req.body.attackerItem,
		match: req.body.match
	});

	
});

export default router;