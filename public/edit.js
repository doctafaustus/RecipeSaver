/* --- Helper Functions --- */
function checkUniqueTag(tagName) {
	var tagUnique = true;
	$('.detail-recipe .tag-name').each(function() {
		if ($(this).text().trim() === tagName) {
			tagUnique = false;
		}
	});
	return tagUnique;
}


/* --- Edit/Add Recipe --- */
// Edit/Add recipe
$('body').on('click', '#edit-recipe, #add-recipe', function(e) {

	var editOrAdd = $(this).attr('id');

	if (editOrAdd === 'edit-recipe') {
		$('#detail-options').trigger('click');
		if (window.stage === 'Edit recipe') {
			return;
		}
		changeStage('Edit recipe');

		//var urlValue = $('#detail-link-editable').val() === '#' ? '' : $('#detail-link-editable').val();

		var urlValue = $('#detail-link').attr('href');

		if (urlValue === '#') {
			urlValue = '';
		}

		$('#detail-link-editable').show().val(urlValue);

	} else if (editOrAdd === 'add-recipe') {
		console.log('Setting up for new recipe');
		$('.detail-recipe').addClass('from-new');
		window.clearDetailPanel();
		$('#cancel-recipe').show(); // Note that this should NOT appear for editing
		tinymce.activeEditor.setContent('');
	}

	// Resize URL input
	window.urlSizeFix();

	// Add class to top icons so that they can be editable
	$('.icons').addClass('editable');
	
	// Show save button
	$('#save-recipe').show();

	// Show all inputs
	$('#detail-description, #mceu_0, #detail-link-container').removeClass('init-hide');

	// Handle details
	$('#detail-name').attr('contenteditable', true);
	tinymce.activeEditor.setMode('code');



	// Show url input
	$('#detail-link-container').show();
	// Hide url link
	$('#detail-link').hide();

	// Focus on name at first
	$('#detail-name').focus();

});

// Prevent carriage return on Recipe Name input
$('#profile').on('keydown', '#detail-name', function(e) {
  if (e.which == 13) {
    e.preventDefault();
    console.log('Preventing carriage return');
    return false;
	}
});




// Save recipe
$('#profile').on('click', '#save-recipe', function(e) {
	var errors = window.validateRecipe();
	if (errors.length) {
		var errorList = '';
		for (var i = 0; i < errors.length; i++) {
			errorList += '<div class="error-message">' + errors[i] + '</div>';
		}
		var $errorBox = $('#error-box');
		$errorBox.find('#error-messages').html(errorList);
		$errorBox.find('.error-message').addClass('no-wrap');
		$errorBox.hide().animate({width:'show'}, 425, function() {
			$errorBox.find('.error-message').removeClass('no-wrap');
		});
		return;
	}

	// Hide any previous error box open if no errors
	$('#error-box').hide();

	var recipeName = $('#detail-name').text().trim();

	var url = $('#detail-link-editable').val() === '#' ? '' : $('#detail-link-editable').val();

	var description = $(tinymce.get('detail-description').getBody()).html().trim();

	if (description === '<p><br data-mce-bogus="1"></p>' || description === '<br data-mce-bogus="1">') {
		description = '';
	}


	var tags = [];
	$('.tag').each(function() {
		var newTag = {
			name: $(this).find('.tag-name').text().trim().toLowerCase(),
			color: $(this).attr('data-tag-color')
		};
		tags.push(newTag);
	});


	// If there is any text in the new tag input then add it to the tags array
	var tagInputText = $('#new-tag').val().trim().toLowerCase();
	if (tagInputText.length > 0) {
		tags.push({name: tagInputText, color: null});
	}
	
	var data = { description: description, recipeName: recipeName, url: url, tags: tags };

	if (window.stage === 'Edit recipe') {

		data.id = $('#detail-id').text();

		// Capture recipe list view so we can regenrate it after edit success
		var recipeListView = $('#list-panel-heading').text().trim().toLowerCase();

		$.ajax({

			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: data,
		  success: function(data) {
		  	var sortView = $('#sort-selection').text().trim();
		  	
		  	console.log('Updated recipe!');
		  	window.populatePanel(data._id, true);
		  	window.resetRecipeState();
		  	$('.editable').removeClass('editable');
		  	changeStage('View recipe');
		  	$('#detail-options-dropdown').hide();

		  	window.showSuccessBox($('#detail-name').text(), ' has been updated!');

		  	console.warn(sortView);
		  	window.refreshRecipeList(recipeListView, sortView, getFeaturedTag());

		  	

		  },
		  error: function(jqXHR) {
				if (jqXHR.status === 413) {
					window.showErrorBox('Recipe is too large');
				} else {
					window.showErrorBox('');
				}
		  }
		});
	} else if (window.stage === 'Add recipe') {
		data.isNew = true;

		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: data,

		  success: function(data) {
		  	console.log('Updated recipe!');
		  	window.populatePanel(data._id, true);
		  	window.resetRecipeState();
		  	$('.editable').removeClass('editable');
		  	changeStage('View recipe');
		  	$('#detail-options-dropdown').hide();
		  	
		  	window.showSuccessBox($('#detail-name').text(), ' has been added to your collection!');
		  	window.refreshRecipeList();
		  	$('.detail-recipe').removeClass('from-new');
		  },
		  error: function(jqXHR) {
				if (jqXHR.status === 413) {
					window.showErrorBox('Recipe is too large');
				} else if (jqXHR.status === 403) {
					window.showErrorBox('- You\'ve reached your maximum storage limit.<br>Please <a href="/plans">upgrade</a> your account to store more recipes.');
				} else {
					window.showErrorBox('');
				}
		  }
		});
	}
});


// Cancel new recipe
$('#profile').on('click', '#cancel-recipe', function() {
	window.clearDetailPanel();
	window.singleLeftPanel();
	// Hide validation error box
	$('#error-box').hide();
});

// Undo recipe updates
$('#profile').on('click', '#undo-recipe', function() {
	window.reloadRightPanel();
});



/* --- Tags --- */
var $newTag = $('#new-tag');
// Submit new tag if enter key pressed
$newTag.on('keypress', function(e) {
  if (e.which == 13) {
  	var tagName = $('#new-tag').val().trim();

  	if (tagName.length === 0) {
  		return;
  	}

  	var id = $('#detail-id').text();

  	// Check to see if this tag exists on the recipe already
		var tagUnique = checkUniqueTag(tagName);

		if (tagUnique) {
			$('#detail-new-tag-input').before('<li class="tag new-tag"><div class="tag-name">' + tagName + '</div><div class="tag-close"></div></li>');
			$('#new-tag').val('');
		} else {
			alert('Tag already being used');
		}

  }
});


// Remove tag
$('#profile').on('click', '.tag-close', function(e) {
	$(this).closest('.tag').remove();
});


// Delete recipe
$('#profile').on('click', '#delete-recipe', function(e) {
	$('#detail-options').trigger('click');
	var id = $('#detail-id').text();

	var recipeListView = $('#list-panel-heading').text().trim().toLowerCase();

	$.ajax({
		type: 'POST',
	  url: '/delete-recipe',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: {id: id},
	  success: function(data) {
	  	console.log('Recipe deleted!');

		  var sortView = $('#sort-selection').text().trim();

	  	// Refresh recipe list to reflect delete
	  	window.refreshRecipeList(recipeListView, sortView, getFeaturedTag());

	  	// Show success box
	  	window.showSuccessBox($('#detail-name').text(), ' deleted');
	  	window.singleLeftPanel();
	  }
	});
});

// Close error box
$('#error-box .close').click(function() {
	$('#error-box').hide();
});



function getFeaturedTag() {
	var $featuredTag = $('#recipe-list-by-tag .tag-category');

	if ($featuredTag.length) {

		var color = $('#detail-tag-list .tag').filter(function() {
			return $(this).text().trim() === $featuredTag.text().trim();
		}).attr('data-tag-color');

		return {
			tagName: $featuredTag.text().trim(),
			tagColor: color
		};	
	}
}