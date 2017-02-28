var nodemailer = require('nodemailer');
var fs = require('fs');
var emailPass = process.env.PORT ? process.env.EMAILPASS : fs.readFileSync('./private/emailPass.txt').toString();

var transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org', 
  port: 465, 
  auth: { 
    user: 'contact@recipesaver.net',
    pass: emailPass,
  },
  secure: true,
});


module.exports = transporter;