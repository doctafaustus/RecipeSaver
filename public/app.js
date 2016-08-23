console.log('running');


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
					tagList += '<li class="tag" data-tag-id="' + tags[i].id + '" style="background-color: ' + tags[i].color + ';"><div class="tag-name">' + tags[i].name + '</div><div class="tag-close"></div></li>';
				}

				$('#detail-tag-list').prepend(tagList);
			}

			// Recipe Name
			$('#detail-name').text(data.name);

			// Recipe Ingredients
			$('#detail-ingredients').text(data.ingredients);

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
	var id = $(this).data('id');
	populatePanel(id);
});

// Show new tag input
$('#profile').on('click', '#detail-add-tag-button', function(e) {
	e.preventDefault();

	// Show new tag input
	$('#detail-new-tag-input').attr('style', 'display: inline-block;');

  // Put focus in contenteditable div
  var newTagInput = document.getElementById("detail-new-tag-input");
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

  // Submit new tag if enter key pressed
  $(document).on('keypress', function(e) {
    if (e.which == 13) {
      $(document).off('keypress');
    	console.log('Submitting new tag...');
    	var tagName = $('#detail-new-tag-input').text().trim()
    	$('#detail-new-tag-input').text('').hide();
    	var id = $('#detail-id').text();
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
    }
  });
  
});


// Hide new tag input on blur
$('#profile').on('blur', '#detail-new-tag-input', function(e) {
	$(this).text('').hide();
});


// Remove tag
$('#profile').on('click', '.tag-close', function(e) {
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

});


// Edit recipe title
$('#profile').on('blur', '#detail-name', function(e) {
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
			$('.recipe-list-entry[data-id="' + id + '"]').text(newRecipeTitle);
	  }
	});
});


// Edit recipe title - trigger blur on enter
$('#profile').on('keydown', '#detail-name', function(e) {
  if (e.which == 13) {
		$(this).trigger('blur');
	}
});


// Edit recipe description
$('#profile').on('blur', '#detail-description', function(e) {
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
});


// Get all tags
$('body').on('click', '#get-recipes-by-tags', function(e) {
	if (window.stage !== 'allTags') {
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
				window.stage = 'allTags';
		  }
		});
	}

});


// Get recipes by tag
$('body').on('click', '.tag-list-name', function(e) {
	var tagName = $(this).text();
	var tagColor = $(this).data('tag-color');
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
		  		recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '">' + recipes[i].name + '</li>';
		  	}

		  	recipeList += '</ul>';

		  	$('#list-panel').html(recipeList);

		  	// Mark stage
				window.stage = 'recipesByTag';
	  }
	});

});


// Get all recipes
$('body').on('click', '#get-all-recipes', function(e) {
	if (window.stage !== 'allRecipes') {
		$.ajax({
			type: 'GET',
		  url: '/get-all-recipes',
		  contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		  success: function(data) {
		  	console.log('Got all recipes!');
		  	var recipes = data;

		  	var recipeList = '<ul id="recipe-list">';
		  	for (var i = 0; i < recipes.length; i++) {
		  		recipeList += '<li class="recipe-list-entry" data-id="' + recipes[i].id + '">' + recipes[i].name + '</li>';
		  	}

		  	recipeList += '</ul>';

		  	$('#list-panel').html(recipeList);

		  	// Mark stage
				window.stage = 'allRecipes';
		  }
		});
	}

});


