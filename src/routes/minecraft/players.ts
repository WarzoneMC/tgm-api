import * as express from 'express';
import { Request, Response } from 'express';
import { r } from '../../server';
import { isAuthenticated, handleJoi, simpleHash } from '../../util';
import playerLogin from '../../schemas/request/playerLogin';

const router = express.Router();

router.post('/login', isAuthenticated, async (req: Request, res: Response) => {
	// When player joins
	if (!handleJoi(playerLogin, req, res)) return;

	const uuid: string = req.body.uuid;

	let player = await r
		.table('players')
		.get(uuid)
		.run();

	let playersWithSameName = await r
		.table('players')
		.filter(
			r
				.row('name')
				.downcase()
				.eq(req.body.name.toLowerCase())
		)
		.run()
		.filter((p) => p.id !== uuid);
	if (playersWithSameName.length > 0) {
		playersWithSameName.forEach(async (p) => {
			await r
				.table('players')
				.get(p.id)
				.update({ name: null })
				.run();
		});
	}

	if (player) {
		// Player has logged in before
		let ips = player.ips;
		if (!ips.includes(simpleHash(req.body.ip)))
			ips.push(simpleHash(req.body.ip));

		player.ips = ips;
		player.name = req.body.name;
		player.lastJoinDate = Date.now(); // TODO: if player is banned don't update lastJoinDate!

		await r
			.table('players')
			.get(uuid)
			.update(player)
			.run();

		// Filter punishments table for player and respond with them - punishments is not stored on player object in db!
		player.punishments = [];
		// Same with deaths
		player.deaths = 0;

		console.log('player login', player);
		res.json({ ok: true, new: false, player });
	} else {
		// Player has NOT logged in before
		player = {
			// Make new player object
			id: uuid,
			name: req.body.name,
			lastJoinDate: Date.now(),
			initialJoinDate: Date.now(),
			ips: [simpleHash(req.body.ip)],
			ranks: [],
			matches: [],
			wins: 0,
			kills: 0,
			woolDestroys: 0
		};

		await r
			.table('players')
			.insert(player)
			.run();

		// Filter punishments table for player and respond with them - punishments is not stored on player object in db!
		player.punishments = [];
		// Same with deaths
		player.deaths = 0;

		console.log('new player login', player);
		res.status(201).json({ ok: true, new: true, player });
	}
});

export default router;