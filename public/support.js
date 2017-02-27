$(document).ready(function() {

	// Open support modal
	$('#support a, #support-footer a, #reg-login-support').click(function(e) {
		e.preventDefault();
		if (!$('#support-modal').is('visible')) {
			$('#support-modal, #support-overlay').show();
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




