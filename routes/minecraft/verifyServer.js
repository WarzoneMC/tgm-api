module.exports = function(req,res,next) {
    console.log('verifying server...');
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        if(token === config.server.token) {
            next(); // good to go
        } else {
            return res.json({"error": true}); //token was incorrect.
        }
    } else {
        // failed without token
        return res.status(403).send({
            "error": true
        });
    }
}