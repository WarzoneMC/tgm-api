const mongoose = require('mongoose');
const User = mongoose.model('user');

module.exports = function(app) {
    app.get('/', function(req, res) {
        res.send('success!');
    })
}