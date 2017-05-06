var nodemailer = require("nodemailer"),
    crypto = require('crypto'),
    algorithm = 'aes-256-ctr';
var async = require('async');

var privateKey = config.key.privateKey;

// create reusable transport method (opens pool of SMTP connections)
// console.log(Config.email.username+"  "+Config.email.password);
var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.email.username,
        pass: config.email.password
    }
});

exports.decrypt = function(password) {
    return decrypt(password);
};

exports.encrypt = function(password) {
    return encrypt(password);
};

exports.sendMailVerificationLink = function(user, token) {
    var textLink = "http://team.gg/verify/" + token;
    var from = config.email.accountName+" Team<" + config.email.username + ">";
    var mailbody = "<p>Thanks for Registering on " + config.email.accountName + " </p><p>Please verify your email by clicking on the verification link below.<br/><a href=" + textLink.toString()
        + ">Verification Link</a></p>";

    // mail(from, user.username , "Account Verification", mailbody);
    mail(from, "chattonluke@gmail.com" , "Account Verification", mailbody);
};

exports.sendMailForgotPassword = function(user) {
    var from = config.email.accountName+" Team<" + config.email.username + ">";
    var mailbody = "<p>Your " + config.email.accountName + "  Account Credential</p><p>username : " + user.username + " , password : " + decrypt(user.password)+"</p>"
    mail(from, user.email , "Account password", mailbody);
};


// method to decrypt data(password)
function decrypt(password) {
    var decipher = crypto.createDecipher(algorithm, privateKey);
    var dec = decipher.update(password, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

// method to encrypt data(password)
function encrypt(password) {
    var cipher = crypto.createCipher(algorithm, privateKey);
    var crypted = cipher.update(password, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function mail(from, email, subject, mailbody){
    var mailOptions = {
        from: from, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        //text: result.price, // plaintext body
        html: mailbody  // html body
    };

    smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.error(error);
        }
        smtpTransport.close(); // shut down the connection pool, no more messages
    });
}

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
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes + ':' + seconds;
}