function populatePanel(id) {
	$.ajax({
		type: 'POST',
	  url: '/recipe',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { id: id},
	  success: function(data) {
			console.log(data);

			// Tags
			$('.tag').remove();
			if (data.tags.length) {
				var tags = data.tags;
				var tagList = '';
				for (var i = 0; i < tags.length; i++) {
					tagList += '<li class="tag" data-tag-id="' + tags[i].id + '" data-tag-color="' + tags[i].color + '" style="background-color: ' + tags[i].color + ';"><div class="tag-name">' + tags[i].name + '</div><div class="tag-close"></div></li>';
				}

				$('#detail-tag-list').prepend(tagList);
			}

			// Recipe URL
			$('#detail-link').text(data.url).attr('href', data.url);

			// Recipe Name
			$('#detail-name').text(data.name);

			// Recipe Ingredients
			$('.ingredient:not("#detail-new-ingredient-input")').remove();
			if (data.ingredients.length) {
				var ingredients = data.ingredients;
				var ingredientsList = '';
				for (var i = 0; i < ingredients.length; i++) {
					ingredientsList += '<li contenteditable class="ingredient" data-ingredient-id="' + ingredients[i].id + '">' + ingredients[i].name + '</li>';
				}
				$('#detail-ingredients').prepend(ingredientsList);
			}


			// Recipe Description
			$('#detail-description').html(data.more)

			// Recipe ID
			$('#detail-id').text(data.id);
	  },
	});
}

// Populate detail panel on recipe list entry click
$('#profile').on('click', '.recipe-list-entry', function(e) {
	e.preventDefault();
	changeStage('Edit recipe');
	var id = $(this).data('id');
	populatePanel(id);
});



// Save reference to ingredient text on click so we can compare on the blur/enter events if it needs to be updated
$('#profile').on('click', '.ingredient', function(e) {
	if (window.stage === 'Edit recipe') {
		window.ingredientComparisonText = $(this).text().trim();
	}
});


function editIngredient($el, enterPressed) {
	// Immediately remove contenteditable attribute so the input doesn't weirdly jump to new line momentarily
	$el.attr('contenteditable', 'false');

	var ingredientText = $el.text().trim();
	var id = $('#detail-id').text();
	var ingredientID = $el.attr('data-ingredient-id');



	// Determine if this is the last item in the list
	var addNewIngredient = false;
	if ($el.index() == $el.siblings().length-1) {
		addNewIngredient = true;
	}

	// Determine if this ingredient should be removed
	var removeIngredient = false;
	if (ingredientText === '') {
		removeIngredient = true;
	}

	$.ajax({
		type: 'POST',
	  url: '/recipe-update',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { id: id, ingredientID: ingredientID, ingredientText: ingredientText, ingredientFlag: true },
	  success: function() {
	  	console.log('Edited ingredient!');

	  	// Remove the populate panel function so you can easily click off one ingredient to another without the flashing of the input since the content is being replaced
	  	//populatePanel(id);

	  	// Re-enabling all .ingredient class elements to be contenteditable
	  	$('.ingredient').attr('contenteditable', 'true');

	  	// Artifically remove ingredient if there was no text submitted
	  	if (removeIngredient) {
	  		$el.remove();
	  	}

			if (enterPressed) {
				if (addNewIngredient) {
					console.log('adding new input');
					// Show new content editable div for new ingredient
					$('#detail-new-ingredient-input').attr('style', 'display: block;');
					showFocus('detail-new-ingredient-input');
				}
			}

	  	window.ingredientEditedViaEnter = false;

	  }
	});
}

// // Edit ingredient - ENTER
// $('#profile').on('keypress', '.ingredient', function(e) {
// 	// If enter key was pressed then submit edits
//   if (e.which == 13) {
//   	editIngredient($(this), true);
//   }
// });
// // Edit ingredient - BLUR
// $('#profile').on('blur', '.ingredient', function(e) {
//   editIngredient($(this), false);
// });
$('#profile').on('keypress blur', '.ingredient', function(e) {
	if (window.stage === 'Edit recipe') {
	  if (e.type === 'keypress' && e.which === 13) {
	  	window.ingredientEditedViaEnter = true;
	  	editIngredient($(this), true);
	  } else if (e.type === 'focusout' && !window.ingredientEditedViaEnter) {
	  	if ($(this).text().trim() === window.ingredientComparisonText) {
	  		console.log('ingredient text the same - not updating');
	  		return;
	  	}
			editIngredient($(this), false);
	  }
	} else if (window.stage === 'Add recipe') {
	  if (e.type === 'keypress' && e.which === 13) {
			console.log('adfas');
			$(this).attr('contenteditable', 'false');
			var input = $(this);
			setTimeout(function() {
				input.attr('contenteditable', 'true');
			}, 100);
		}	
	}
});






function submitNewIngredient($el) {
	// Immediately remove contenteditable attribute so the input doesn't weirdly jump to new line momentarily
	$el.attr('contenteditable', 'false');
	var newIngredientText = $el.text().trim();
	var id = $('#detail-id').text();

	$.ajax({
		type: 'POST',
	  url: '/recipe-update',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { id: id, newIngredientText: newIngredientText },
	  success: function() {
	  	console.log('Added new ingredient!');
	  	populatePanel(id);

			$('#detail-new-ingredient-input').attr('style', 'display: block;');
			$('#detail-new-ingredient-input').text('').attr('contenteditable', 'true');
			showFocus('detail-new-ingredient-input');

			window.ingredientSubmittedViaEnter = false;
	  }
	});
}


// Submit new ingredient
$('#profile').on('keypress blur', '#detail-new-ingredient-input', function(e) {

	// Edit recipe stage
	if (window.stage === 'Edit recipe') {
		// If enter key was pressed then submit new ingredient
	  if (e.type === 'keypress' && e.which === 13) {
	  	console.log('Addine new ingredients via ENTER');
	  	window.ingredientSubmittedViaEnter = true;
	  	submitNewIngredient($(this));
	  } else if (e.type === 'focusout' && !window.ingredientSubmittedViaEnter) {
	  	console.log('Addine new ingredients via BLUR');
			if ($(this).text().trim() === "") {
				$('#detail-new-ingredient-input').attr('style', 'display: none;');
				console.log('Nothing in input - hiding');
			} else {
				submitNewIngredient($(this));
			}
	  }
	}

	// Add recipe stage
	if (window.stage === 'Add recipe') {
	  if (e.type === 'keypress' && e.which === 13) {
	  	console.log('Adding new ingredient row');
	  	$(this).attr('contenteditable', 'false').hide();;

	  	$('#detail-ingredients').append(['<li contenteditable="true" class="ingredient">' + $(this).text() + '</li>', $(this)]);
	  	$(this).attr('contenteditable', 'true')
	  	setTimeout(function() {
	  		$('#detail-new-ingredient-input').html('');
	  		$('#detail-new-ingredient-input').attr('style', 'display: block;');
	  		showFocus('detail-new-ingredient-input');
	  }, 50);

	  }
	}
});


// Show new tag input
$('#profile').on('click', '#detail-add-tag-button', function(e) {
	e.preventDefault();

	// Show new tag input
	$('#detail-new-tag-input').attr('style', 'display: inline-block;');

  // Put focus in contenteditable div
  showFocus('detail-new-tag-input');

  // Submit new tag if enter key pressed
  $(document).on('keypress', function(e) {
  	if (window.stage === 'Edit recipe') {
	    if (e.which == 13) {
	      $(document).off('keypress');
	    	console.log('Submitting new tag...');


	    	var tagName = $('#detail-new-tag-input').text().trim();
	    	$('#detail-new-tag-input').text('').hide();
	    	var id = $('#detail-id').text();


	    	// Check to see if this tag exists on the recipe already
				var tagUnique = checkUniqueTag(tagName);


				if (tagUnique) {
					$.ajax({
						type: 'POST',
					  url: '/recipe-update',
					  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
					  data: { id: id, tagName: tagName },
					  success: function() {
					  	console.log('Added new tag!');
					  	populatePanel(id);
					  }
					});
				} else {
					alert('Tag already being used');
				}

	    }
  	}

  	if (window.stage === 'Add recipe') {
	    if (e.which == 13) {
	      $(document).off('keypress');

	    	var tagName = $('#detail-new-tag-input').text().trim().toLowerCase();

	    	console.log('Adding temporary tag: ' + tagName);

	    	// If tagName is empty return
	    	if (tagName === '') {
	    		$('#detail-new-tag-input').text('').hide();
	    		return;
	    	}


	    	// Check to see if this tag exists on the recipe already
	    	var tagUnique = checkUniqueTag(tagName);
	    	if (!tagUnique) {
	    		alert('Tag already being used');
	    		// Clear tag input
	    		$('#detail-new-tag-input').text('').hide();
	    		return;
	    	}


	    	// Transform tag text into a temporary tag
	    	$('#detail-tag-list').append(['<li class="tag" data-tag-id="2" data-tag-color="#808080" style="background-color: #808080;"><div class="tag-name">' + tagName + '</div><div class="tag-close"></div></li>', $('#detail-new-tag-input')]);

	    	// Clear tag input
	    	$('#detail-new-tag-input').text('');



	    }
  	}
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


// Hide new tag input on blur
$('#profile').on('blur', '#detail-new-tag-input', function(e) {
	$(this).text('').hide();
});


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


// Edit recipe title
$('#profile').on('blur', '#detail-name', function(e) {
	if (window.stage === 'Edit recipe') {
		var id = $('#detail-id').text();
		var newRecipeTitle = $(this).text();
		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: { id: id, recipeName: newRecipeTitle },
		  success: function() {
		  	console.log('Updated recipe title!');
		  	populatePanel(id);

		  	// Replace recipe name div simply to force losing focus of the contenteditable div
		  	var recipeNameClone = $('#detail-name').clone();
				$('#detail-name').replaceWith(recipeNameClone);

				// Update recipe name in list panel
				$('.recipe-list-entry[data-id="' + id + '"] a').text(newRecipeTitle);
		  }
		});
	}

});


// Edit recipe title - trigger blur on enter
$('#profile').on('keydown', '#detail-name', function(e) {
  if (e.which == 13) {
		$(this).trigger('blur');
	}
});


// Save reference to current recipe description so we can compare later so we don't need to fire extra network calls
$('#profile').on('click', '#detail-description', function(e) {
	window.descriptionComparisonText = $(this).text().trim();
});

// Edit recipe description
$('#profile').on('blur', '#detail-description', function(e) {
	if (window.stage === 'Edit recipe') {
		if ($(this).text().trim() === window.descriptionComparisonText) {
			console.log('Description text the same - not updating.');
			return;
		}

		var id = $('#detail-id').text();
		var newRecipeDescription = $(this).html();

		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: { id: id, recipeDescription: newRecipeDescription },

		  success: function() {
		  	console.log('Updated recipe description!');
		  	populatePanel(id);
		  }
		});
	}
});


// Get all tags
$('body').on('click', '#get-recipes-by-tags', function(e) {
	if (window.stage !== 'All tags') {
		$.ajax({
			type: 'GET',
		  url: '/get-all-tags',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',

		  success: function(data) {
		  	console.log('Got all tags!');
		  	var tags = data;

		  	var tagList = '<ul id="tag-list">';
		  	for (var i = 0; i < tags.length; i++) {
		  		tagList += '<li class="tag-list-name" data-tag-color="' + tags[i].color + '" data-tag-list-id="' + tags[i].id + '" style="background-color: ' + tags[i].color + ';"><div class="tag-name">' + tags[i].name + '</div><div class="tag-color-picker"></div></li>';
		  	}

		  	tagList += '</ul>';

		  	$('#list-panel').html(tagList);

		  	// Mark stage
		  	changeStage('All tags');
		  }
		});
	}

});


// Get recipes by tag
$('body').on('click', '.tag-name', function(e) {
	var tagName = $(this).text();
	var tagColor = $(this).closest('.tag-list-name').attr('data-tag-color') ||  $(this).closest('.tag').attr('data-tag-color');

	console.info('tagColor: ' + tagColor)

	$.ajax({
		type: 'POST',
	  url: '/get-recipes-by-tag',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { tagName: tagName, tagColor: tagColor },

	  success: function(data) {
	  	console.log('Got recipes by tag!');
	  	console.log(data);
		  	var recipes = data.recipesToSend;
		  	var color = data.tagColor;

		  	var recipeList = '<ul id="recipe-list-by-tag">';
		  	recipeList += '<li class="tag-category" style="background-color: ' + color + ';">' + tagName + '</li>';
		  	for (var i = 0; i < recipes.length; i++) {
		  		recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '"><a>' + recipes[i].name + '</a></li>';
		  	}

		  	recipeList += '</ul>';

		  	$('#list-panel').html(recipeList);

		  	// Mark stage
		  	changeStage('Recipes by tag');
	  }
	});

});


// Get all recipes
$('body').on('click', '#get-all-recipes', function(e) {
	changeStage('All recipes');

	adjustPanels();


	$.ajax({
		type: 'GET',
	  url: '/get-all-recipes',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  success: function(data) {
	  	console.log('Got all recipes!');
	  	var recipes = data;

	  	var recipeList = '<ul id="recipe-list">';
	  	for (var i = 0; i < recipes.length; i++) {
	  		recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '"><a>' + recipes[i].name + '</a></li>';
	  	}

	  	recipeList += '</ul>';

	  	$('#list-panel').html(recipeList);
	  }
	});
	

});




// Select new Tag Color
$('body').on('click', '.tag-color-picker', function(e) {
	// Save reference to picked tag
	$(this).closest('.tag-list-name').addClass('picked-tag');

	var position = $(this).offset();
	$('#tag-colors').attr('style', 'display: block; position: absolute; top: ' + (position.top + 10) +'px; left: ' + (position.left + 20) + 'px;');

});


// Update tag color
$('body').on('click', '.tag-color-selection', function(e) {
	var tagColorToChange = $('.picked-tag').data('tag-color');
	var tagName = $('.picked-tag').find('.tag-name').text();
	var newTagColor = $(this).data('color');

	console.log(tagColorToChange);
	console.log(newTagColor);

	$.ajax({
		type: 'POST',
	  url: '/update-tag-color',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { tagColorToChange: tagColorToChange, tagName: tagName, newTagColor: newTagColor },
	  success: function(data) {
	  	console.log('Updated tag color!');

	  	// Artificially change picked tag color
	  	$('.picked-tag').attr('style', 'background-color: ' + newTagColor + ';').attr('data-tag-color', newTagColor);

	  	// Hide tag color selection box
	  	$('#tag-colors').hide();


	  	$('.picked-tag').removeClass('picked-tag');
	  }
	});


	
});



// Add Recipe Stage
$('#add-recipe').click(function() {
	changeStage('Add recipe');

	adjustPanels();

	console.log('Adding new recipe');
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

});

// Submit Recipe
$('#profile').on('click', '#submit-recipe', function(e) {

	// Get array of temporary tags
	var tags = [];
	$('#detail-tag-list .tag-name').each(function() {
		tags.push($(this).text());
	});


	// Get array of ingredients
	var ingredients = [];
		$('.ingredient').each(function() {
		ingredients.push($(this).text());
	});

	// Compile form data
	var data = {
		tags: tags,
		url: $('#detail-link-editable').val().trim(),
		recipeName: $('#detail-name').text(),
		ingredients: ingredients,
		recipeDetails: $('#detail-description').html(),
	};


	console.log(data);

	$.ajax({
		type: 'POST',
	  url: '/new-recipe',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: data,
	  success: function(data) {
	  	console.log('Submitted tag color!');
	  }
	});




});


/* HELPER FUNCTIONS */

// Show focus on contenteditable div
function showFocus(id) {
  var newTagInput = document.getElementById(id);
  newTagInput.onfocus = function() {
      window.setTimeout(function() {
          var sel, range;
          if (window.getSelection && document.createRange) {
              range = document.createRange();
              range.selectNodeContents(newTagInput);
              range.collapse(true);
              sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
          } else if (document.body.createTextRange) {
              range = document.body.createTextRange();
              range.moveToElementText(newTagInput);
              range.collapse(true);
              range.select();
          }
      }, 1);
  };
  newTagInput.focus();
}

// Adjust view of panels
function adjustPanels() {
	switch(window.stage) {
		case 'Add recipe':
			if ($('#list-panel').is(':visible')) {
				$('#list-panel').animate({width: 'hide'}, 190);
			}
			$('.detail-recipe').addClass('singular');
			break;
		default:
			// First remove existing special classes
			$('.detail-recipe').removeClass('singular');
			$('#list-panel').animate({width: 'show'}, 190);
	}
}

// Slugify
function slugify(text) {
  return text.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');
}

// Change the window state and HTML class
function changeStage(state) {
	window.stage = state;
	$('html').removeClass();
	$('html').addClass(slugify(state));

	// Show URL input and hide formatted link
	if (state !== 'Add recipe') {
		$('#detail-link-editable').hide();
		$('#detail-link').show();
	} else {
		$('#detail-link-editable').show();
		$('#detail-link').hide();
	}
}