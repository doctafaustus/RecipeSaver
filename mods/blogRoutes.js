function blogRoutes(app) {
	app.get('/blog', function(req, res) {
	  res.render('blog.ejs');
	});

	app.get('/blog/its-here-recipe-saver-2-debuts', function(req, res) {
	  res.render('its-here-recipe-saver-2-debuts.ejs');
	});

	app.get('/blog/cookbook-review-fast-food', function(req, res) {
	  res.render('cookbook-review-fast-food.ejs');
	});
}

module.exports = blogRoutes;