var captchaCallback = function() {
	// Support form captcha
  grecaptcha.render('support-recaptcha', {'sitekey' : '6LeWjRMUAAAAANJVtCMzAcR5juxvKHeFgVIYrmOc'});

  // Registration form captcha
  if (document.getElementById('register-recaptcha')) {
    window.registerRecaptchaId = grecaptcha.render('register-recaptcha', {'sitekey' : '6LeWjRMUAAAAANJVtCMzAcR5juxvKHeFgVIYrmOc'});
  }
};

$(document).ready(function() {
	// Open support modal
	$('#support a, #support-footer a, #reg-login-support, #modal-contact').click(function(e) {
		e.preventDefault();
		if (!$('#support-modal').is('visible')) {
			$('#support-modal, #support-overlay').show();
			$('#read-more-modal').hide();
		}
	});

	// Close support modal
	$('body').on('click', '#support-modal .close', function() {
  	$('#support-init').show();
  	$('#support-sucess').hide();
		$('#support-modal, #support-overlay').hide();
		grecaptcha.reset();
	});

	$('body').on('submit', '#support-form', function(e) {
		e.preventDefault();

		// Validate form
		if (!$('#support-name').val().length || !$('#support-email').val().length || !$('#support-subject').val().length || !$('#support-message').val().length) {
			$('#support-recaptcha-error').show().text('Please complete all fields');
			return;
		} 

		var data = {
			name: $('#support-name').val(),
			email: $('#support-email').val(),
			subject: $('#support-subject').val(),
			message: $('#support-message').val(),
			gRecaptchaResponse: grecaptcha.getResponse(),
		};
		$.ajax({
			type: 'POST',
		  url: '/support',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: data,
		  success: function() {
		  	$('#support-init').hide();
		  	$('#support-sucess').show();
		  	$('#support-recaptcha-error').hide();
		  	// Clear form
		  	$('#support-name, #support-email, #support-subject, #support-message').val('');
			},
			error: function(xhr) {
				if (xhr.status === 403) {
					$('#support-recaptcha-error').show().text('Captcha vaildation failed');
				}
				if (xhr.status === 404) {
					$('#support-recaptcha-error').show().text('Something went wrong. Please email us directly at contact@recipesaver.net');
				}
				grecaptcha.reset();
			}
		});

	});

});




