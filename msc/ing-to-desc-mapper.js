// var recipes = [{"_id":{"$oid":"58d1dd653c9c31000464a2fc"},"user_id":"58d1dcea3c9c31000464a2fb","recipeName":"White Bean Stew","description":"","url":"https://cooking.nytimes.com/recipes/1018666-white-bean-stew-with-carrots-fennel-and-peas","servings":"","readyIn":"","cals":"","favorite":false,"creationDate":{"$date":"2017-03-22T02:11:49.411Z"},"tags":[],"ingredients":[],"__v":0},
// {"_id":{"$oid":"58d1e6e2bd6fae00047a5acc"},"user_id":"58a5348b00c2680400a5296d","recipeName":"Sautéed Italian-Style Breaded Chicken Tenderloins","description":"","url":"http://www.haverhillbeef.com/RPchickentenderitaliansaut.html","servings":"","readyIn":"","cals":"","favorite":false,"creationDate":{"$date":"2017-03-22T02:52:18.841Z"},"tags":[{"color":"#808080","name":"chicken"}],"ingredients":[],"__v":0},
// {"_id":{"$oid":"58d20eb3063fbb00040889e8"},"user_id":"58d0a8516c48b40004b8a175","recipeName":"Recipe Saver","description":"","url":"https://www.recipesaver.net/recipes","servings":"","readyIn":"0","cals":"","favorite":false,"creationDate":{"$date":"2017-03-22T05:42:11.577Z"},"tags":[{"name":"new","color":"#ffa500"}],"__v":2,"ingredients":[]},
// {"_id":{"$oid":"58d21290063fbb00040889e9"},"user_id":"58d0a8516c48b40004b8a175","recipeName":"My eBay All Selling","description":"","url":"http://my.ebay.com/ws/eBayISAPI.dll?MyEbayBeta\u0026CurrentPage=MyeBayNextAllSelling\u0026ssPageName=STRK:ME:LNLK:MESX","servings":"","readyIn":"0","cals":"","favorite":false,"creationDate":{"$date":"2017-03-22T05:58:40.527Z"},"tags":[],"ingredients":[],"__v":0},
// {"_id":{"$oid":"58d27625063fbb00040889eb"},"user_id":"54ea5e21901b39030026a72e","recipeName":"No Sugar Oatmeal Cookies","description":"Preheat oven to 350 degrees F (175 degrees C).\u003cbr\u003e\u003cbr\u003eStir oats, bananas, applesauce, raisins, almond milk, vanilla extract, and cinnamon together in a bowl until evenly mixed; drop by the spoonful onto a baking sheet.\u003cbr\u003e\u003cbr\u003eBake in the preheated oven until the edges are golden, 15 to 20 minutes.\u003cbr\u003e\u003cbr\u003e","url":"http://allrecipes.com/recipe/233012/no-sugar-oatmeal-cookies/","servings":"","readyIn":"0","cals":"","favorite":false,"creationDate":{"$date":"2017-03-22T13:03:33.841Z"},"tags":[],"ingredients":["2 cups rolled oats","3 ripe bananas, mashed","1/3 cup applesauce","1/2 cup raisins (optional)","1/4 cup almond milk","1 teaspoon vanilla extract","1 teaspoon ground cinnamon"],"__v":0},
// {"_id":{"$oid":"58d297f5063fbb00040889ee"},"user_id":"54eb3b7e5f0a940300ff73ab","recipeName":"Grilled Filet","description":"So many deliciousness here\u003cdiv\u003e\u003cbr\u003e\u003c/div\u003e","url":"www.brightgauge.com","servings":"2","readyIn":"15","cals":"200","favorite":false,"creationDate":{"$date":"2017-03-22T15:27:49.365Z"},"tags":[{"color":"#808080","name":"steak"},{"color":"#808080","name":"grill"}],"ingredients":["Steak","Salt","Pepper"],"__v":0},
// {"_id":{"$oid":"58d2b9c4063fbb00040889f0"},"user_id":"58d0a8516c48b40004b8a175","recipeName":"Spinach Alfredo Sauce (Better than Olive Garden®)","description":"Heat butter in a saucepan over low heat; cook spinach in the melted butter until warmed, about 1 minute. Add cream and cream cheese to spinach mixture; cook and stir until cream cheese is melted, about 5 minutes.\u003cbr\u003e\u003cbr\u003eFold Parmesan cheese and garlic powder into spinach mixture; season with salt and pepper. Simmer until sauce is thickened and smooth, about 10 more minutes.\u003cbr\u003e\u003cbr\u003e","url":"http://allrecipes.com/recipe/231860/spinach-alfredo-sauce-better-than-olive-garden/?internalSource=popular\u0026referringContentType=home%20page\u0026clickId=cardslot%208","servings":"","readyIn":"0","cals":"","favorite":false,"creationDate":{"$date":"2017-03-22T17:52:04.233Z"},"tags":[],"ingredients":["1/2 cup butter","3/4 cup thawed frozen chopped spinach","1 pint heavy whipping cream","3 tablespoons cream cheese","1 cup grated Parmesan cheese","1 teaspoon garlic powder","1 pinch salt and ground black pepper to taste (optional)"],"__v":0}];


var fs = require('fs');
 console.log("\n *START* \n");
 var recipes = JSON.parse(fs.readFileSync("recipes_backup(4-4-17).json"));
 console.log("\n *EXIT* \n");



var newRecipes = recipes.map(function(recipe) {
	var newIngs = [];
	if (recipe.ingredients && recipe.ingredients.length) {
		recipe.ingredients.forEach(function(ing) {
			newIngs.push('<li>' + ing + '</li>');
		});
		recipe.description = '<b>Ingredients:</b><br><ul>' + newIngs.join('') + '</ul><br>' + recipe.description;
		//console.log(recipe); 
	}
	delete recipe.ingredients;
	delete recipe.cals;
	delete recipe.readyIn;
	delete recipe.servings;
	return recipe;
});


fs.writeFile('reformattedRecipes.json', JSON.stringify(newRecipes), function (err) {
  if (err) return console.log(err);
  console.log('newRecipes > reformattedRecipes.json');
});

//console.log(JSON.stringify(recipes));