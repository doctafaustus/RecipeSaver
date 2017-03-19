var transporter = require('./transporter.js');
var crypto = require('crypto');


function sendEmail(emailMsg, type) {
	return function(req, res, next) {
		console.log(type)
		if (type === 'support') {
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
				html: emailMsg,
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

		} else if (type === 'registration') {
	    // Send registration email
			transporter.sendMail({
				from: '"Recipe Saver" <contact@recipesaver.net>',
				to: req.body.email,
				subject: 'Welcome to Recipe Saver!',
				html: emailMsg,
			}, function(error, info){
			  if (error) {
	        console.log(error);
	        res.sendStatus(404);
	        return;
			  }
			  console.log('Registration confirmation message sent successfully to ' + req.body.email);
				next();
	      return;
			});
		
		} else if (type === 'forgotPassword') {
			console.log('Sending forgot password email');
			var token;
      crypto.randomBytes(20, function(err, buf) {
        token = buf.toString('hex');
				transporter.sendMail({
					from: '"Recipe Saver" <contact@recipesaver.net>',
					to: req.body.email,
					subject: 'Recipe Saver Password Reset',
					text: 'You are receiving this because you (or someone else) have requested the reset of your account password.\n\n' +
				          'Please click the following link to reset your Recipe Saver password:\n\n' +
				          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
				          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				}, function(error, info){
				  if (error) {
		        console.log(error);
		        res.sendStatus(404);
		        return;
				  }
				  console.log('Password reset email sent successfully to ' + req.body.email);
				  req.rsToken = token;
					next();
		      return;
				});
      });
		} else if (type === 'reset') {
			// NOTE: This module will not be used as middleware in this case
			console.log('Sending password reset email');
		}  
	}
}

module.exports = sendEmail;