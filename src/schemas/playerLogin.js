const Joi = require('joi');
const { USERNAME_REGEX } = require('../constants');

module.exports = Joi.object()
	.keys({
		name: Joi.string()
			.regex(USERNAME_REGEX)
			.required(),
		uuid: Joi.string()
			.uuid()
			.required(),
		ip: Joi.string()
			.ip()
			.required()
	})
	.required();
