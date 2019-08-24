const Joi = require('joi');

exports.isAuthenticated = (req, res, next) => {
	if (
		!req.headers.authorization ||
		req.headers.authorization.split(' ')[1] !== process.env.ACCESS_TOKEN
	)
		return res.status(403).json({ ok: false, error: 'Invalid access token' });
	next();
};

exports.handleJoi = (schema, req, res) => {
	let result = Joi.validate(req.body, schema);
	if (result.error) {
		if (!result.error.isJoi) {
			console.error(
				`Error while running Joi at ${Date.now()}: ${result.error}`
			);
			res.sendStatus(500);
			return false;
		}
		res.status(400).json({
			ok: false,
			error: result.error.details.map((item) => item.message)[0]
		});
		return false;
	} else return true;
};

/* 
 IMPORTANT NOTE: This is a simple hash function for 
 some light security. You should not use this for sensitive data!! 
 It may be reversible. ~jellz
 */
exports.simpleHash = (string) => {
	return string.split('').reduce((a, b) => {
		a = (a << 5) - a + b.charCodeAt(0);
		return a & a;
	}, 0);
};
