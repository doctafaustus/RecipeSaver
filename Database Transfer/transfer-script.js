/* --- USERS --- */
// First generate a key like { email: _id }
var key = {};
users.forEach(function(user) {
	var email = user.email;
	var _id = user._id.$oid;
	key[email] = _id;

	// Add new stuf
	user.subscription = 'Full (Legacy)';
	delete user.resetPasswordToken;
	delete user.resetPasswordExpires;
});


/* --- RECIPES --- */
// Then loop through recipes and change every user_id to the id found in the key
var dateFromObjectId = function (objectId) {
	return new Date(parseInt(objectId.substring(0, 8), 16) * 1000).toISOString();
};
recipes.forEach(function(recipe) {
	var newID = key[recipe.user_id];
	recipe.user_id = newID;

	// Add new stuff
	recipe.ingredients = [];
	recipe.description = recipe.notes;
	delete recipe.notes;
	recipe.servings = '';
	recipe.readyIn = '';
	recipe.cals = '';
	recipe.favorite = false;
	var newTags = [];
	if (recipe.tags && recipe.tags.length) {
		recipe.tags.forEach(function(tag) {
			newTags.push({ name: tag, color: '#808080'});
		});
		recipe.tags = newTags
	} else {
		recipe.tags = [];
	}
	recipe.creationDate = dateFromObjectId(recipe._id.$oid);
});

copy(JSON.stringify(recipes));