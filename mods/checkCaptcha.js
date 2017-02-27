var fs = require('fs');
var request = require('request');
var captchaSecretKey = process.env.PORT ? null : fs.readFileSync('./private/captchaSecretKey.txt').toString();

function checkCaptcha(req, res, next) {
	console.log('checking captcha...');
  if (req.body.gRecaptchaResponse === undefined || req.body.gRecaptchaResponse === '' || req.body.gRecaptchaResponse === null) {
    console.log('captcha vaildation failed');
    res.sendStatus(403);
    return;
  } else {
  	var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + captchaSecretKey + "&response=" + req.body.gRecaptchaResponse + "&remoteip=" + req.connection.remoteAddress;
	  request(verificationUrl, function(error, response, body) {
	    var body = JSON.parse(body);
	    if (body.success !== undefined && !body.success) {
	      console.log('failed captcha verification');
	      res.sendStatus(403);
	      return;
	    }
	  	next();
	  });
  }
}

module.exports = checkCaptcha;