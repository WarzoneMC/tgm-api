import * as Joi from 'joi';
import { USERNAME_REGEX } from '../constants';

export default Joi.object()
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
