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
					tagList += '<li class="tag" data="' + tags[i].id + '" style="background-color: ' + tags[i].color + ';">' + tags[i].name + '</li>';
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