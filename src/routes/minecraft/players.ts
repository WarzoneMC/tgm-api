import * as express from 'express';
import { Request, Response } from 'express';
import { isAuthenticated, handleJoi, simpleHash } from '../../util';
import playerLogin from '../../schemas/request/playerLogin';
import PlayerModel from '../../models/Player';

const router = express.Router();

router.post('/login', isAuthenticated, async (req: Request, res: Response) => {
	// When player joins
	if (!handleJoi(playerLogin, req, res)) return;

	const uuid: string = req.body.id;
	const name: string = req.body.name;

	// if Player has other player's name, change existing account's name to null
	var p = await PlayerModel.findOneAndUpdate(
		{
			nameLower: name.toLowerCase()
		},
		{ name: null, nameLower: null }
	);
	console.log(p);

	let player = await PlayerModel.findById(uuid);
	if (player) {
		// Player has logged in before
		let ips = player.ips;
		if (!ips.includes(simpleHash(req.body.ip)))
			ips.push(simpleHash(req.body.ip));

		player = await PlayerModel.findByIdAndUpdate(
			uuid,
			{
				ips,
				name,
				nameLower: name.toLowerCase(),
				lastJoinDate: Date.now()
			},
			{ new: true }
		);

		// Filter punishments table for player and respond with them - punishments is not stored on player doc in db!
		// @ts-ignore
		player.punishments = []; // TODO: add punishments

		console.log('player login', player);
		res.json({ ok: true, player });
	} else {
		// Player has NOT logged in before
		player = await PlayerModel.create({
			_id: uuid,
			name,
			nameLower: name.toLowerCase(),
			lastJoinDate: Date.now(),
			initialJoinDate: Date.now(),
			ips: [simpleHash(req.body.ip)],
			ranks: [],
			wins: 0,
			losses: 0,
			kills: 0,
			deaths: 0,
			matchesPlayed: 0
		});

		// @ts-ignore
		player.punishments = [];

		console.log('new player login', player);
		res.status(201).json({ ok: true, player });
	}
});

router.get('/:id', async (req, res) => {
	let player: any;
	if (req.query.byName) {
		player = await PlayerModel.findByName(req.params.id);
		if (!player) res.status(404);
	} else {
		player = await PlayerModel.findById(req.params.id);
		if (!player) res.status(404);
	}
	res.json({ player });
});

export default router;
