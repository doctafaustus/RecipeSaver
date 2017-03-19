/* --- Helper Functions --- */
function createIngredientInputs() {
	$('.ingredient').each(function() {
		$(this).html('<input class="temp-ing-input" type="text" value="' + $(this).html() + '">');
	});
}

function sortableIngredients() {
	$('#detail-ingredients').sortable({containment: '#detail-ingredients', scroll: false});
	$('#detail-ingredients').sortable('refresh');
}

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
		// Reset any portions adjustments
		window.resetPortionAdjustment();
		var urlValue = $('#detail-link-editable').val() === '#' ? '' : $('#detail-link-editable').val();
			$('#detail-new-ingredient-input').html('');
		$('#detail-link-editable').show().val(urlValue);

	} else if (editOrAdd === 'add-recipe') {
		console.log('Setting up for new recipe');
		$('.detail-recipe').addClass('from-new');
		window.clearDetailPanel();
		$('#cancel-recipe').show(); // Note that this should NOT appear for editing
	}

	// Resize URL input
	window.urlSizeFix();

	// Add class to top icons so that they can be editable
	$('.icons').addClass('editable');
	
	// Show save button
	$('#save-recipe').show();

	// Show all inputs
	$('#detail-ingredients, #detail-description, #detail-link-container').removeClass('init-hide');

	// Handle details
	$('#detail-description, #detail-name').attr('contenteditable', true);

	// Show new ingredient input
	$('#detail-new-ingredient-input').show();

	// Show url input
	$('#detail-link-container').show();
	// Hide url link
	$('#detail-link').hide();

	createIngredientInputs();

	// Make ingredients list sortable
	sortableIngredients();

	// Focus on name at first
	$('#detail-name').focus();

});

// Prevent carriage return on Recipe Name input
$('#profile').on('keydown', '#detail-name, .ingredient', function(e) {
  if (e.which == 13) {
    event.preventDefault();
    console.log('Preventing carriage return');
    return false;
	}
});

// Add new ingredient input when editing
$('#profile').on('keydown', '#detail-new-ingredient-input', function(e) {
  if (e.which == 13) {
    e.preventDefault();
    console.log('Dupliciating ingredient input');

    // If there's no text then return
    if ($(this).text().trim() === '') {
    	return;
    }

    var ingTextToDuplicate = $(this).text();
    $('#detail-ingredients').append('<li class="ingredient ui-sortable-handle"><input type="text" class="temp-ing-input" value="' + ingTextToDuplicate + '"></li>');
    $(this).text('');
    sortableIngredients();
    return false;
	}
});

// Recipe empty ingredients
$('#profile').on('keyup', '.ingredient', function(e) {
  if (e.which == 46 || e.which == 8) {
  	if ($(this).find('input').val().trim() === '') {
  		$(this).remove();
		}
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
	var ingredients = [];
	$('.ingredient').each(function() {
		ingredients.push($(this).find('input').val().trim());
	});

	var url = $('#detail-link-editable').val() === '#' ? '' : $('#detail-link-editable').val();
	var description = $('#detail-description').html();
	var servings = $('#serving-input').val();
	var readyIn = $('#mins-input').val();
	var cals = $('#cals-input').val();
	var tags = [];
	$('.tag').each(function() {
		var newTag = {
			name: $(this).find('.tag-name').text().trim().toLowerCase(),
			color: $(this).attr('data-tag-color')
		};
		tags.push(newTag);
	});


	// If there is any text in the new ingredient input then add it to the ingredients array
	var ingInputText = $('#detail-new-ingredient-input').text().trim();
	if (ingInputText.length > 0) {
		ingredients.push(ingInputText);
	}

	// If there is any text in the new tag input then add it to the tags array
	var tagInputText = $('#new-tag').val().trim().toLowerCase();
	if (tagInputText.length > 0) {
		tags.push({name: tagInputText, color: null});
	}
	
	var data = { description: description, recipeName: recipeName, ingredients: ingredients, url: url, tags: tags, servings: servings, readyIn: readyIn, cals: cals };

	if (window.stage === 'Edit recipe') {
		data.id = $('#detail-id').text();

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
		  	$('#detail-new-ingredient-input').html('');

		  	window.showSuccessBox($('#detail-name').text(), ' has been updated!');
		  	window.refreshRecipeList();
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
		  	$('#detail-new-ingredient-input').html('');
		  	
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
// Show new tag input
$('#profile').on('click', '#detail-add-tag-button', function(e) {
	e.preventDefault();

	if (!$('html').hasClass('edit-recipe') && !$('html').hasClass('add-recipe')) {
		return;
	}

	// Show new tag input
	$('#detail-new-tag-input').attr('style', 'display: inline-block;');

	var $newTag = $('#new-tag');
	$newTag.focus();

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
  
});



// Remove tag
$('#profile').on('click', '.tag-close', function(e) {
	$(this).closest('.tag').remove();
});



/* --- Artificially change values for Servings, Time, and Calories --- */
$('#profile').on('click', '.icons', function() {
	var $el = $(this);
	var $dropdown;
	var servingsInputChanged = false;
	var timeInputChanged = false;
	var calInputChanged = false;

	if (!$el.hasClass('editable')) {
		return;
	}

	switch($el.attr('id')) {
		case 'portion-icon':
			$dropdown = $('#portion-dropdown-2');
			break;
		case 'clock-icon':
			$dropdown = $('#clock-dropdown');
			break;
		case 'cal-icon':
		  $dropdown = $('#cal-dropdown');
		  break;
	}

	$el.addClass('active');

	$('#serving-input').one('keyup change', function() {
		servingsInputChanged = true;
	});
	$('#mins-input').one('keyup change', function() {
		timeInputChanged = true; 
	});
	$('#cals-input').one('keyup change', function() {
		calInputChanged = true; 
	});

	$('#serving-input, #mins-input, #cals-input').on('keyup.temp', function(e) {
	  if (e.which == 13) {
	    $(this).off('keyup.temp');
	    // Let the proceeding slideDown function take care of populating the values
	    $('body').trigger('click');
	    return false;
		}
	});


	$dropdown.slideDown('fast', function() {
		$('body').on('click.id', function(e) {
			var container = $dropdown;
  		if (!container.is(e.target) && container.has(e.target).length === 0) {
      	container.hide();
      	$('#portion-num').val('');
      	$('body').unbind('click.id');
      	$el.removeClass('active');

      	if (servingsInputChanged) {
					var value = $('#serving-input').val().length ? $('#serving-input').val() : $('#servings').html().match(/\d/)[0];
					$('#servings').html(value);
      	}
      	if (timeInputChanged) {
      		var value = $('#mins-input').val().length ? $('#mins-input').val() : 0;
      		$('#mins').html(window.convertMinsToHours(value));
      		// var value = $('#mins-input').val().length ? convertMinsToHours($('#mins-input').val()) : 0;
      		// $('#mins').html(value);
      	}
      	if (calInputChanged) {
      		var value = $('#cals-input').val().length ? $('#cals-input').val() : 0;
      		$('#cals').html(value + ' cals');
      	}
  		}
		});
	});

});



// Delete recipe
$('#profile').on('click', '#delete-recipe', function(e) {
	$('#detail-options').trigger('click');
	var id = $('#detail-id').text();

	$.ajax({
		type: 'POST',
	  url: '/delete-recipe',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: {id: id},
	  success: function(data) {
	  	console.log('Recipe deleted!');
	  	// Refresh recipe list to reflect delete
	  	window.refreshRecipeList();

	  	// Show success box
	  	window.showSuccessBox($('#detail-name').text(), ' deleted');
	  	window.singleLeftPanel()
	  }
	});
});

// Close error box
$('#error-box .close').click(function() {
	$('#error-box').hide();
});