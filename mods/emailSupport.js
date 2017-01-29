var fs = require('fs');
var request = require('request');
var captchaSecretKey = process.env.PORT ? null : fs.readFileSync('./private/captchaSecretKey.txt').toString();
var transporter = require('./transporter.js');
var supportMessageDetails	= require('./supportMessageDetails.js');

function supportMessage(req, res) {
  if (req.body.gRecaptchaResponse === undefined || req.body.gRecaptchaResponse === '' || req.body.gRecaptchaResponse === null) {
    console.log('no captcha selected');
    res.sendStatus(403);
    return;
  }

  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + captchaSecretKey + "&response=" + req.body.gRecaptchaResponse + "&remoteip=" + req.connection.remoteAddress;

  request(verificationUrl, function(error, response, body) {
    var body = JSON.parse(body);

    if (body.success !== undefined && !body.success) {
      console.log('failed captcha verification');
      res.sendStatus(403);
      return;
    }

    // Send user's message to contact@recipesaver.net
    transporter.sendMail({
      from: req.body.email,
      to: 'contact@recipesaver.net',
      subject: req.body.subject,
      text: req.body.message,
    }, function(error, info){
      if (error) {
        console.log(error);
      }
      console.log('User\'s message sent successfully to contact@recipesaver.net');
    });

    // Send confirmation email
		transporter.sendMail({
			from: '"Recipe Saver" <contact@recipesaver.net>',
			to: req.body.email,
			subject: 'Support message recieved',
			html: supportMessageDetails,
		}, function(error, info){
		  if (error) {
        console.log(error);
        res.sendStatus(404);
        return;
		  }
		  console.log('Support confirmation message sent successfully to ' + req.body.email);
      res.sendStatus(200);
      return;
		});

  });
}

module.exports = supportMessage;