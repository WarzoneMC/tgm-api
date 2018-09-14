var async = require('async');

exports.matchPlayerWithId = function(players, id, callback) {
    if(id == null) {
        return callback(null);
    }
    async.eachSeries(players, function(player, next) {
        if(player._id.toString() == id.toString()) {
            console.log('found player [' + player.name + ']')
            callback(player);
        } else {
            next();
        }
    }, function(err) {
        callback(null);
    })
}

exports.toMMSS = function (sec_num) {
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = Math.floor(sec_num - (hours * 3600) - (minutes * 60));

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes + ':' + seconds;
}