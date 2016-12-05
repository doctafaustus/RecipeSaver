/* --- NEW EDIT --- */

function test() {
	$('.ingredient').each(function() {
		$(this).html('<input type="text" value="' + $(this).html() + '">');
	});
}


// Edit recipe
$('#profile').on('click', '#edit-recipe', function(e) {
	$('#detail-options').trigger('click');

	if (window.stage === 'Edit recipe') {
		return;
	}

	changeStage('Edit recipe');
	
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
	$('#detail-link-editable').show().val($('#detail-link').attr('href'));
	// Hide url link
	$('#detail-link').hide();

	test();

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

	// If there is any text in the new ingredient input then add it to the ingredients array
	var ingInputText = $('#detail-new-ingredient-input').text().trim();
	if (ingInputText.length > 0) {
		ingredients.push(ingInputText);
	}
	
	$.ajax({

		type: 'POST',
	  url: '/recipe-update',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { id: id, recipeDescription: newRecipeDescription, recipeName: newRecipeName, ingredients: ingredients },

	  success: function() {
	  	console.log('Updated recipe description!');
	  	populatePanel(id);
	  	resetRecipeState();

	  	changeStage('null');
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


