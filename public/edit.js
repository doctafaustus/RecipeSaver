/* --- NEW EDIT --- */

function createIngredientInputs() {
	$('.ingredient').each(function() {
		$(this).html('<input type="text" value="' + $(this).html() + '">');
	});
}

// Edit/Add recipe
$('body').on('click', '#edit-recipe, #add-recipe', function(e) {

	var isEdit = $(this).attr('id') === 'edit-recipe';
	if (isEdit) {
		$('#detail-options').trigger('click');

		if (window.stage === 'Edit recipe') {
			return;
		}

		changeStage('Edit recipe');

		// Reset any portions adjustments
		window.resetPortionAdjustment();

		$('#detail-link-editable').show().val($('#detail-link').attr('href'));
	} else {
		console.log('Setting up for new recipe');
		window.urlSizeFix();
		// Clear id
		$('#detail-id').html('');
		// Clear tags
		$('.tag').remove();
		// Clear url
		$('#detail-link-editable').val('');
		// Clear name
		$('#detail-name').html('');
		// Clear ingredients
		$('.ingredient').remove();
		// Show new ingredient input and clear it
		$('#detail-new-ingredient-input').show().text('');
		// Clear description
		$('#detail-description').html('');
	}

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
    event.preventDefault();
    console.log('Dupliciating ingredient input');

    // If there's no text then return
    if ($(this).text().trim() === '') {
    	return;
    }

		// Get highest number ingredient ID and increment it
		// var newIngredientID;
		// var ingredientIDs = $('.ingredient').map(function() {
		// 	return $(this).data('ingredient-id');
		// });
		// function getMaxOfArray(numArray) {
		//   return Math.max.apply(null, numArray);
		// }
		// newIngredientID = (getMaxOfArray(ingredientIDs)) + 1;

    var ingTextToDuplicate = $(this).text();
    $('#detail-ingredients').append('<li class="ingredient ui-sortable-handle"><input type="text" value="' + ingTextToDuplicate + '"></li>');
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

	/* Add Validation */

	// Assign ingredients an id so the order will persist
	// $('.ingredient').each(function() {
	// 	$(this).attr('data-ingredient-id', $(this).index());
	// });

	var id = $('#detail-id').text();
	var newRecipeName = $('#detail-name').text().trim();
	var ingredients = [];
	$('.ingredient').each(function() {
		ingredients.push($(this).find('input').val().trim());
	});
	var newRecipeDescription = $('#detail-description').html();
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
	
	$.ajax({

		type: 'POST',
	  url: '/recipe-update',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { id: id, recipeDescription: newRecipeDescription, recipeName: newRecipeName, ingredients: ingredients, tags: tags, servings: servings, readyIn: readyIn, cals: cals },

	  success: function() {
	  	console.log('Updated recipe description!');
	  	populatePanel(id);
	  	resetRecipeState();
	  	$('.editable').removeClass('editable');
	  	changeStage('View recipe');
	  	$('#detail-options-dropdown').hide();
	  	$('#detail-new-ingredient-input').html('');
	  }

	});
});


function resetRecipeState() {
	$('#detail-description, #detail-name').attr('contenteditable', false);
	$('#save-recipe').hide();
	$('#detail-ingredients').sortable('destroy');
	$('#detail-new-ingredient-input').hide();
}

function sortableIngredients() {
	$('#detail-ingredients').sortable({containment: '#detail-ingredients', scroll: false});
	$('#detail-ingredients').sortable('refresh');
}


/* --- Tags --- */
// Show new tag input
$('#profile').on('click', '#detail-add-tag-button', function(e) {
	e.preventDefault();

	if (!$('html').hasClass('edit-recipe')) {
		return;
	}

	// Show new tag input
	$('#detail-new-tag-input').attr('style', 'display: inline-block;');

	$.fn.setCursorPosition = function (pos) {
    this.each(function (index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
};
	
	var $newTag = $('#new-tag');
	$newTag.focus();

  // Submit new tag if enter key pressed
  $newTag.on('keypress', function(e) {
	    if (e.which == 13) {
	      //$(document).off('keypress');
	    	console.log('Submitting new tag...');

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

  	// if (window.stage === 'Add recipe') {
	  //   if (e.which == 13) {
	  //     $(document).off('keypress');

	  //   	var tagName = $('#detail-new-tag-input').text().trim().toLowerCase();

	  //   	console.log('Adding temporary tag: ' + tagName);

	  //   	// If tagName is empty return
	  //   	if (tagName === '') {
	  //   		$('#detail-new-tag-input').text('').hide();
	  //   		return;
	  //   	}


	  //   	// Check to see if this tag exists on the recipe already
	  //   	var tagUnique = checkUniqueTag(tagName);
	  //   	if (!tagUnique) {
	  //   		alert('Tag already being used');
	  //   		// Clear tag input
	  //   		$('#detail-new-tag-input').text('').hide();
	  //   		return;
	  //   	}


	  //   	// Transform tag text into a temporary tag
	  //   	$('#detail-tag-list').append(['<li class="tag" data-tag-id="2" data-tag-color="#808080" style="background-color: #808080;"><div class="tag-name">' + tagName + '</div><div class="tag-close"></div></li>', $('#detail-new-tag-input')]);

	  //   	// Clear tag input
	  //   	$('#detail-new-tag-input').text('');



	  //   }
  	// }
  });
  
});

function checkUniqueTag(tagName) {
	var tagUnique = true;
	$('.detail-recipe .tag-name').each(function() {
		if ($(this).text().trim() === tagName) {
			tagUnique = false;
		}
	});
	return tagUnique;
}


// Remove tag
$('#profile').on('click', '.tag-close', function(e) {
	if (window.stage === 'Edit recipe') {
		var recipeID = $('#detail-id').text();
		var $tag = $(this).closest('.tag');
		var tagID = $tag.data('tag-id');
		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: { id: recipeID, tagToRemove: tagID },
		  success: function() {
		  	console.log('Removed recipe tag!');

		  	// Artifically hide removed tag
		  	$tag.hide();
		  }
		});
	} else if (window.stage === 'Add recipe') {
		// Simply remove the visible tag
		$(this).closest('.tag').remove();
	}
});