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
			// Designate recipe as a non-favorite at first
			$('#favorite').removeClass('favorited').find('span').first().text('Favorite');


			// Favorite
			if (data.favorite) {
				$('#favorite').addClass('favorited').find('span').first().text('Favorited');
			}

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
					tagList += '<li class="tag" data-tag-color="' + tags[i].color + '" style="background-color: ' + tags[i].color + ';"><div class="tag-name">' + tags[i].name + '</div><div class="tag-close"></div></li>';
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
			if (data.ingredients && data.ingredients.length) {
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

			// Recipe Date
			$('#detail-date').text(data.date);

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
	if (data.ingredients && data.ingredients.length) {
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
		  		tagList += '<li class="tag-list-name" data-tag-color="' + tags[i].color + '" style="background-color: ' + tags[i].color + ';"><div class="tag-name">' + tags[i].name + '</div><div class="tag-color-picker"></div></li>';
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
});



// Recipe Submenu Dropdown
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

	  	// Show success box
	  	var $successBox = $('#success-box');

	  	$successBox.find('#success-message-recipe').text($('#detail-name').text());
	  	$successBox.find('#sucess-message-text').text('has been deleted');
	  	$successBox.addClass('temp-height');
	  	$successBox.animate({width:'toggle'}, 425, function() {
	  		setTimeout(function() {
	  			$successBox.fadeOut(3000);
	  			$successBox.removeClass('temp-height');
	  		}, 4000);
	  	});
	  }
	});

});



// Sorting reset
$('#menu li').click(function() {
  $('#sort-selection').text('');
});


// Favorite recipe
$('#profile').on('click', '#favorite', function() {
	var $favoriteItem = $(this);
	if (!$(this).hasClass('favorited')) {
		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: {id: $('#detail-id').text(), favoriteType: 'add'},
		  success: function(data) {
		  	console.log('Recipe favorited!');
		  	$favoriteItem.addClass('favorited').find('span').first().text('Favorited');
		  	// If the Favorite Recipes panel is open then prepend the list with this newly favorited recipe
		  	if ($('#list-panel-heading').hasClass('favorites-active')) {
		  		var recipeName = $('#detail-name').text();
		  		var id = $('#detail-id').text();
		  		var date = $('#detail-date').text();
		  		$('#recipe-list').prepend('<li class="recipe-list-entry" data-id="' + id + '"><span class="recipe-list-entry-left"><a>' + recipeName + '</a></span><span class="recipe-list-entry-date"><a>' + date + '</a></span></li>');
		  		// Remove any sort filter just to eliminate confusion
		  		$('#sort-selection').text('');
		  	}
		  }
		});
	} else {
		var idToRemove = $('#detail-id').text();
		$.ajax({
			type: 'POST',
		  url: '/recipe-update',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  data: {id: $('#detail-id').text(), favoriteType: 'remove'},
		  success: function(data) {
		  	console.log('Recipe unfavorited!');
		  	$favoriteItem.removeClass('favorited').find('span').first().text('Favorite');
		  	// If the Favorite Recipes panel is open then artificially remove the unfavorited recipe from the list
		  	if ($('#list-panel-heading').hasClass('favorites-active')) {
		  		$('.recipe-list-entry[data-id='+ idToRemove +']').hide();
		  		// Remove any sort filter just to eliminate confusion
		  		$('#sort-selection').text('');
		  	}
		  }
		});
	}
	// To slide menu up:
	$('#detail-options').click();
});


// Show all favorited recipes
$('#get-favorite-recipes').click(function() {
	changeStage('Favorite recipes');
	$.ajax({
		type: 'GET',
	  url: '/get-favorite-recipes',
	  success: function(data) {
	  	console.log('Got all favorite recipes!');

			var recipes = data;
			var recipeList = '<ul id="recipe-list">';
			for (var i = 0; i < recipes.length; i++) {
				recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '"><span class="recipe-list-entry-left"><a>' + recipes[i].name + '</a></span><span class="recipe-list-entry-date"><a>' + recipes[i].date + '</a></span></li>';
			}
			recipeList += '</ul>';
			$('#list-panel-inner').html(recipeList);

			// Change panel title
			$('#list-panel-heading').text('Favorite Recipes');

			// Add class to List Panel Heading
			$('#list-panel-heading').addClass('favorites-active');
	  }
	});
});


// Show all uncategorized recipes
$('#get-uncategorized-recipes').click(function() {
	changeStage('Uncategorized recipes');
	$.ajax({
		type: 'GET',
	  url: '/get-uncategorized-recipes',
	  success: function(data) {
	  	console.log('Got all uncategorized recipes!');

			var recipes = data;
			var recipeList = '<ul id="recipe-list">';
			for (var i = 0; i < recipes.length; i++) {
				recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '"><span class="recipe-list-entry-left"><a>' + recipes[i].name + '</a></span><span class="recipe-list-entry-date"><a>' + recipes[i].date + '</a></span></li>';
			}
			recipeList += '</ul>';
			$('#list-panel-inner').html(recipeList);

			// Change panel title
			$('#list-panel-heading').text('Uncategorized Recipes');

			// Add class to List Panel Heading
			$('#list-panel-heading').addClass('uncategorized-active');
	  }
	});
});



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


/* --- Sorting -- */
// Clicking off to close
$('#profile').on('click', '#sort', function() {
	$('#sort-options').slideDown('fast', function() {
		$('body').on('click.sort', function(e) {
			var container = $('#sort-options');
  		if (!container.is(e.target) && container.has(e.target).length === 0) {
  			console.log('auto up')
      	$('#sort-options').slideUp('fast');
  		}
  		$('body').unbind('click.sort');
		});
	});
});
$('#profile').on('click', '.sort-option', function() {
	// Hide dropdown box
	$('#sort-options').hide();

	// Populate "Sort by:" with selected sort option
	$('#sort-selection').text($(this).text());

	var $listPanelList = $('#list-panel-inner ul');
	// Sort list according to chosen id from dropdown list

	if (['initial', 'All recipes', 'Recipes by tag', 'View recipe', 'Favorite recipes', 'Uncategorized recipes'].indexOf(window.stage) > -1) {
		switch($(this).attr('id')) {
			case 'sort-newest':
				var sortedList = $('#list-panel .recipe-list-entry').sort(function(a, b) {
					return moment($(b).find('.recipe-list-entry-date a').text(), 'M/D/YYYY').valueOf() - moment($(a).find('.recipe-list-entry-date a').text(), 'M/D/YYYY').valueOf();
				});
				$listPanelList.append(sortedList);
				break;
			case 'sort-oldest':
				var sortedList = $('#list-panel .recipe-list-entry').sort(function(a, b) {
					return moment($(a).find('.recipe-list-entry-date a').text(), 'M/D/YYYY').valueOf() - moment($(b).find('.recipe-list-entry-date a').text(), 'M/D/YYYY').valueOf();
				});
				$listPanelList.append(sortedList);
				break;
			case 'sort-a-z':
				var sortedList = $('#list-panel .recipe-list-entry').sort(function(a, b) {
					var val = $(a).find('.recipe-list-entry-left a').text().toLowerCase() < $(b).find('.recipe-list-entry-left a').text().toLowerCase() ? -1 : 1;
					return val;
				});
				$listPanelList.append(sortedList);
				break;
			case 'sort-z-a':
				var sortedList = $('#list-panel .recipe-list-entry').sort(function(a, b) {
					var val = $(a).find('.recipe-list-entry-left a').text().toLowerCase() > $(b).find('.recipe-list-entry-left a').text().toLowerCase() ? -1 : 1;
					return val;
				});
				$listPanelList.append(sortedList);
		}
	} else if (window.stage === 'All tags') {
		switch($(this).attr('id')) {
			case 'sort-a-z':
				var sortedList = $('#list-panel .tag-list-name').sort(function(a, b) {
			    if ($(a).find('.tag-name').text().toLowerCase() < $(b).find('.tag-name').text().toLowerCase()) return -1;
			    if ($(a).find('.tag-name').text().toLowerCase() > $(b).find('.tag-name').text().toLowerCase()) return 1;
			    return 0;
				});
				$listPanelList.append(sortedList);
				break;
			case 'sort-z-a':
				var sortedList = $('#list-panel .tag-list-name').sort(function(a, b) {
			    if ($(b).find('.tag-name').text().toLowerCase() < $(a).find('.tag-name').text().toLowerCase()) return -1;
			    if ($(b).find('.tag-name').text().toLowerCase() > $(a).find('.tag-name').text().toLowerCase()) return 1;
			    return 0;
				});
				$listPanelList.append(sortedList);
				break;
			case 'sort-color':
				var sortedList = $('#list-panel .tag-list-name').sort(function(a, b) {
			    if ($(a).attr('data-tag-color') < $(b).attr('data-tag-color')) return -1;
			    if ($(a).attr('data-tag-color') > $(b).attr('data-tag-color')) return 1;
			    return 0;
				});
				$listPanelList.append(sortedList);
				break;
		}
	}

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


// Print recipe
$('#profile').on('click', '#print', function() {
	// To slide menu up:
	$('#detail-options').click();
	window.print();
});

/* HELPER FUNCTIONS */
window.resetPortionAdjustment = function() {
	$('#converted-message').hide();
	$('.converted').remove();
	$('.ingredient').show();
}

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
	var $listPanel = $('#list-panel');
	var $detailPanel = $('.detail-recipe');

	switch(window.stage) {
		case 'Add recipe':
			if ($listPanel.is(':visible')) {
				//$listPanel.animate({width: 'hide'}, 190);
				$listPanel.hide();
				$detailPanel.addClass('singular');
			}
			break;
		case 'View recipe':
			if (!$detailPanel.is(':visible')) {
				$listPanel.removeClass('singular');
			}
			break;
		default:
			console.log('default');
			// First remove existing special classes
			$detailPanel.removeClass('singular');
			$listPanel.animate({width: 'show'}, 190);
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

	// Hide any new tag input information
	if (state !== 'Edit recipe') {
		$('#detail-new-tag-input').attr('style', 'display: none');
		$('#new-tag').val('');
		resetEdit();
	}

	// Remove unneeded sort options for All tags stage
	if (state === 'All tags') {
		$('#sort-a-z').click();
	}
}


window.urlSizeFix = function() {
	var $linkContainer = $('#detail-link-container');
	var showStyle = $linkContainer.attr('style') && $linkContainer.attr('style').indexOf('display: block') > -1 ? ' display: block;' : '';
	$linkContainer.hide();
	var newWidth = $('.detail-recipe').width() - 42;
	$linkContainer.attr('style',' max-width: ' + newWidth + 'px;' + showStyle);
}

$(window).resize(urlSizeFix);

window.urlSizeFix();

// Convert minutes to h + m
function convertMinsToHours(m) {
	var minutes = m % 60;
	var hours = (m - minutes) / 60;

	minutes = (m % 60 === 0 ? '' : minutes + 'm');
	hours = (m >= 60 ? hours + 'h ' : '');
	return hours + minutes;
}

// Reset changes made by clicking "Edit Recipe"
function resetEdit() {
	$('.icons').removeClass('editable');
	$('#save-recipe').hide();
	$('#detail-description, #detail-name').attr('contenteditable', false);
	$('#detail-new-ingredient-input').hide();
	if ($('.ui-sortable').length) {
		$('#detail-ingredients').sortable('destroy');
	}
	
}