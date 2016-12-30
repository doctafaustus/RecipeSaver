window.stage = 'initial';
function populatePanel(id) {
	$.ajax({
		type: 'POST',
	  url: '/recipe',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  data: { id: id},
	  success: function(data) {
			console.log(data);

			// Rehide everything first
			$('#detail-ingredients, #detail-description, #detail-link-container').addClass('init-hide');

			// Remove and converted value divs and conversion message
			$('.converted, #converted-message').remove();

			// Servings
			$('#servings').html(data.servings);
			$('#original-yield').html(data.servings);

			// Ready In
			$('#mins').html(convertMinsToHours(data.readyIn));
			$('#portion-num').val('');

			// Calories
			$('#cals').html(data.cals + ' cals');
			$('#cals-input').val('');

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
			console.info(data.ingredients);
			$('.ingredient').remove();
			if (data.ingredients.length) {
				var ingredients = data.ingredients;
				var ingredientsList = '';
				for (var i = 0; i < ingredients.length; i++) {
					ingredientsList += '<li class="ingredient">' + ingredients[i] + '</li>';
				}
				$('#detail-ingredients').prepend(ingredientsList);
			}


			// Recipe Description
			$('#detail-description').html(data.more)

			// Recipe ID
			$('#detail-id').text(data.id);

			// Show/Hide Recipe URL
			if ($('#detail-link').attr('href').length) {
				$('#detail-link-container').show();
			} else {
				$('#detail-link-container').hide();
			}

			showPopulatedInputs(data);

			urlSizeFix();
	  },
	});
}

function showPopulatedInputs(data) {
	if (data.ingredients.length) {
		$('#detail-ingredients').removeClass('init-hide');
	}
	if (data.more.length) {
		$('#detail-description').removeClass('init-hide');
	}
	if (data.url.length) {
		$('#detail-link-container').removeClass('init-hide');
	}
}

function refreshRecipeList() {
	$.ajax({
		type: 'GET',
	  url: '/get-all-recipes',
	  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
	  success: function(data) {
	  	console.log('Got all recipes!');

			var recipes = data;
			var recipeList = '<ul id="recipe-list">';
			for (var i = 0; i < recipes.length; i++) {
				recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '"><span class="recipe-list-entry-left"><a>' + recipes[i].name + '</a></span><span class="recipe-list-entry-date"><a>' + recipes[i].date + '</a></span></li>';
			}
			recipeList += '</ul>';
			$('#list-panel-inner').html(recipeList);

			// Change panel title
			$('#list-panel-heading').text('All Recipes');

			// Save reference to recipes in global JS so they can be retrieved with search
			window.recipes = data;
	  }
	});
}



// Populate detail panel on recipe list entry click or search suggestion click
$('#profile, #search-suggestions').on('click', '.recipe-list-entry, .suggestion', function(e) {
	e.preventDefault();
	changeStage('View recipe');
	adjustPanels();
	var id = $(this).data('id');
	populatePanel(id);
});




// Show new tag input
$('#profile').on('click', '#detail-add-tag-button', function(e) {
	e.preventDefault();

	// Show new tag input
	$('#detail-new-tag-input').attr('style', 'display: inline-block;');

  // Put focus in contenteditable div

  // Submit new tag if enter key pressed
  $('#new-tag').on('keypress', function(e) {
	    if (e.which == 13) {
	      //$(document).off('keypress');
	    	console.log('Submitting new tag...');

	    	var tagName = $('#new-tag').val().trim();
	    	var id = $('#detail-id').text();

	    	// Check to see if this tag exists on the recipe already
				var tagUnique = checkUniqueTag(tagName);

				if (tagUnique) {
					$('#detail-new-tag-input').before('<li class="tag"><div class="tag-name">' + tagName + '</div><div class="tag-close"></div></li>');
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

		  	$('#list-panel-inner').html(tagList);

				// Change panel title
				$('#list-panel-heading').text('Tags');

		  	// Mark stage
		  	changeStage('All tags');

		  	adjustPanels();
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
				recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '"><span class="recipe-list-entry-left"><a>' + recipes[i].name + '</a></span><span class="recipe-list-entry-date"><a>' + recipes[i].date + '</a></span></li>';
			}

	  	recipeList += '</ul>';

	  	$('#list-panel-inner').html(recipeList);

	  	// Change panel title
	  	$('#list-panel-heading').text('Recipes By Tag');

	  	// Mark stage
	  	changeStage('Recipes by tag');
	  }
	});

});

// Select new Tag Color
$('body').on('click', '.tag-color-picker', function(e) {
	// Remove any lingering picked tag classes
	$('.tag-list-name').removeClass('picked-tag');
	// Save reference to picked tag
	$(this).closest('.tag-list-name').addClass('picked-tag');

	var position = $(this).offset();
	$('#tag-colors').attr('style', 'display: block; position: absolute; top: ' + (position.top + 10) +'px; left: ' + (position.left + 20) + 'px;');


	// Update tag color
	$('body').on('click.tagColor', function(e) {
		console.info(e.target.className);

		var container = $('#tag-colors');
		if (!container.is(e.target) && container.has(e.target).length === 0) {
    	$('#tag-colors').hide();
    	$('body').unbind('click.tagColor');
    	console.log('clicked outside box');
    	return;
		} else if (e.target.className === 'tag-color-selection') {
			console.log('clicked new color');
			$('body').unbind('click.tagColor');

			var tagColorToChange = $('.picked-tag').data('tag-color');
			var tagName = $('.picked-tag').find('.tag-name').text();
			var newTagColor = $(e.target).data('color');

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

		}


	});

});


// Get all recipes
$('body').on('click', '#get-all-recipes', function(e) {
	changeStage('All recipes');
	adjustPanels();
	refreshRecipeList();
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

	  	$('#get-all-recipes').trigger('click');
	  	$('#success-box').animate({width:'toggle'}, 425);
	  }
	});

});

// Submenu dropdown
$('#profile').on('click', '#detail-options', function(e) {
	var $el = $(this);
	$el.addClass('active');
	$('#detail-options-dropdown').slideDown('fast', function() {
		$('body').on('click.dd', function(e) {
			var $portionDropdown = $('#portion-dropdown-1');

			var container = $('#detail-options-dropdown');
  		if ((!container.is(e.target) && container.has(e.target).length === 0) && !Boolean($portionDropdown.is(e.target) || $(e.target).parents('#portion-dropdown-1').length) || ($('#adjust-portions').is(e.target) && +$('#portion-num').val() >=1 && +$('#portion-num').val() < 9 )) {
      	$('#detail-options-dropdown').slideUp('fast');
      	$portionDropdown.hide();
      	$('body').unbind('click.dd');
      	$el.removeClass('active');
      	$('.main-active').removeClass('main-active');
  		}
		});
	});
});


$('#detail-link-editable').focusout(function() {
	if (window.stage === 'Edit recipe') {
		var id = $('#detail-id').text();


		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: {id: id, newURL: $('#detail-link-editable').val()},
		  success: function(data) {
		  	console.log('Recipe url updated!');
		  }
		});
	}
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

	  	
			$('#detail-description').append('<div id="detail-message-overlay"><div id="detail-message-overlay-inner">Recipe deleted</div></div>');

	  	// Show "Recipe deleted" overlay
	  	$('#detail-message-overlay').fadeIn('slow');
	  	// Refresh recipe list to reflect delete
	  	refreshRecipeList();
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
	console.log(window.stage);
	switch(window.stage) {
		case 'Add recipe':
			if ($('#list-panel').is(':visible')) {
				$('#list-panel').animate({width: 'hide'}, 190);
			}
			$('.detail-recipe').addClass('singular');
			break;
		case 'View recipe':
			if (!$('.detail-recipe').is(':visible')) {
				$('#list-panel').removeClass('singular');
			}
			break;
		default:
			console.log('default');
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

$(window).resize(urlSizeFix);

function urlSizeFix() {
	var $linkContainer = $('#detail-link-container');
	var showStyle = $linkContainer.attr('style') && $linkContainer.attr('style').indexOf('display: block') > -1 ? ' display: block;' : '';
	$linkContainer.hide();
	var newWidth = $('.detail-recipe').width() - 42;
	$linkContainer.attr('style',' max-width: ' + newWidth + 'px;' + showStyle);
}

urlSizeFix();

// Convert minutes to h + m
function convertMinsToHours(m) {
	var minutes = m % 60;
	var hours = (m - minutes) / 60;

	minutes = (m % 60 === 0 ? '' : minutes + 'm');
	hours = (m >= 60 ? hours + 'h ' : '');
	return hours + minutes;
}

/* --- Recipe Search --- */


// Autopopulate search suggestions
$('#search-form-input').keyup(function() {
	var $suggestionDiv = $('#search-suggestions');
	var input = $(this).val().toLowerCase().trim();

	// If only empty text entered then return
	if (input.length < 1) {
		$suggestionDiv.hide();
		return;
	}

	var recipes = window.recipes;

	var foundRecipes = 0;
	var limit = 10;

	var list = '';

	// Sort recipes by name first
	recipes = recipes.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );

	// Get all recipes that contain the input
	for (var i = 0, recipesLength = recipes.length; i < recipesLength; i++) {
		if (recipes[i].name.toLowerCase().indexOf(input) > -1 && foundRecipes < limit) {


			// Bold the substring that was searched for by inserting a span
			var startPos = recipes[i].name.toLowerCase().indexOf(input);
			var endPos = startPos + input.length;

			var strStart = recipes[i].name.substring(0, startPos);
			var boldPart = recipes[i].name.substring(startPos, endPos);
			var strEnd = recipes[i].name.substring(endPos);

			var formattedStr = strStart + '<span class="sug-bold">' + boldPart + '</span>' + strEnd;


			list += '<li class="suggestion" data-id="' + recipes[i].id + '">' + formattedStr + '</li>';
			foundRecipes++;
		}
	}

	// Replace the suggestion list with new suggestions
	if (list) {
		$('#search-suggestions').find('ul').html(list);
	} else {
		$('#search-suggestions').find('ul').html('<li>No recipes found</li>');
	}
	
	// Show div
	$suggestionDiv.show();

	// Hide div on next click
	$('body').one('click', function() {
		$suggestionDiv.hide();
	});
});

	// Select the first suggestion on enter press
$('#search-form').submit(function(e) {
	e.preventDefault();

	// Trigger click on first suggestion
	if ($('#search-suggestions').is(':visible')) {
		$('#search-suggestions').find('.suggestion').first().trigger('click');
	}
});

// Clear search form on suggestion selection
$('#search-suggestions').click('.suggestion', function() {
	$('#search-form-input').val('');
});




/* --- Icons --- */
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
      		$('#mins').html(convertMinsToHours(value));
      	}
      	if (calInputChanged) {
      		var value = $('#cals-input').val().length ? $('#cals-input').val() : 0;
      		$('#cals').html(value + ' cals');
      	}
  		}
		});
	});

});


/* --- Adjust Portions -- */
$('#profile')
.on('click', '#portion', function() {
	$(this).addClass('main-active');
	$('#portion-dropdown-1').show();
	$('#portion-validation').hide();
})
.on('click', '#adjust-portions', function() {
	// Reshow original ingredient entries
	$('.ingredient').show();

	// Remove any existing converted value divs or conversion message
	$('.converted, #converted-message').remove();

	var multiplier = +$('#portion-num').val();
	var currentSize = +$('#servings').html();
	var originalMultiplier = multiplier;

	// Validation
	if (multiplier < 1 || multiplier > 8) {
		console.log('YES');
		$('#portion-validation').slideDown();
		return;
	}

	// If the multiplier was the same as the current serving size then do nothing
	if (multiplier === currentSize) {
		return;
	}

	// If no multiplier was entered then do nothing
	if (!multiplier) {
		return;
	}

	multiplier = multiplier / currentSize;
	
	window.convert(multiplier, originalMultiplier);
})
// Reset portion adjustment
.on('click', '#converted-message-close', function() {
	resetPortionAdjustment();
});


window.resetPortionAdjustment = function() {
	$('#converted-message').hide();
	$('.converted').remove();
	$('.ingredient').show();
}