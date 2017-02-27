var transporter = require('./transporter.js');

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
			console.log('asfasdf');
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
		}
	}
}

module.exports = sendEmail;