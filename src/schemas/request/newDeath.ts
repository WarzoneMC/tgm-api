import * as Joi from 'joi';

export default Joi.object()
	.keys({
		victim: Joi.string()
			.uuid()
			.required(),
		attacker: Joi.string().uuid(),
		victimItem: Joi.string()
			.max(64)
			.required(),
		attackerItem: Joi.string().max(64),
		match: Joi.string()
			.uuid()
			.required()
	})
	.required();
