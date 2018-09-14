export default function (req, res, next) {
    console.log('verifying server...');
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    const storedToken = process.env.AUTH_SERVER_TOKEN || 'dummy';

    if (token) {
        if (token === storedToken) {
            next(); // good to go
        } else {
            return res.json({ "error": true }); //token was incorrect.
        }
    } else {
        // failed without token
        return res.status(403).send({
            "error": true
        });
    }
}