var express = require('express');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require('fs');
var favicon = require('serve-favicon');
var request = require('request');
var bcrypt = require('bcryptjs');
var async = require('async');



// DATABASE
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //allows use to define our schema
var ObjectId = Schema.ObjectId;

mongoose.Promise = global.Promise; // Removes decprecation warning
mongoose.connect('mongodb://localhost/recipe_saver', function() {
	console.log('Connected to local db!');
});

var User = mongoose.model('User', new Schema({
	id: ObjectId,
	email: String,
	password: String,
	name: String,
	twitterId: String,
	facebookId: String,
	googleId: String,
  creationDate: {type: Date, default: Date.now},
}));

var Recipe = mongoose.model('Recipe', new Schema({
	id: ObjectId,
	user_id: String,
	recipeName: String,
	ingredients: [String],
	description: String,
	url: String,
	tags: { type : Array , "default" : [] },
	servings: String,
	readyIn: String,
	cals: String,
	favorite: Boolean,
  creationDate: {type: Date, default: Date.now},
}));


// CUSTOM MODULES
var emailSupport = require('./mods/emailSupport.js');

var twitterAppSecret = process.env.PORT ? null : fs.readFileSync('./private/twitterAppSecret.txt').toString();
var facebookAppSecret = process.env.PORT ? null : fs.readFileSync('./private/facebookAppSecret.txt').toString();
var googleAppSecret = process.env.PORT ? null : fs.readFileSync('./private/googleAppSecret.txt').toString();

// Twitter login
passport.use(new TwitterStrategy({
    consumerKey: 'YjrR2EFz03kHgnTElEsKB6jcC',
    consumerSecret: twitterAppSecret,
    callbackURL: process.env.PORT ? null : 'http://127.0.0.1:3000/login/twitter/return',
  },
  function(token, tokenSecret, profile, done) {
  	console.log('-------------------------------------');
  	console.log(profile);
	  process.nextTick(function() {
	    User.findOne({ 'twitterId' : profile.id }, function(err, user) {
	      if (err) return done(err);
	      if (user) {
	      	console.log('Twitter user found, yo!');
	        return done(null, user); // User found, return that user
	      } else { // User not found, create new user
	      	console.log('Creating new Twitter user');
	        var newUser = new User();
	        newUser.name = profile.displayName;
	        newUser.twitterId = profile.id;
	        newUser.save(function(err) {
	          if (err) {
	            throw err;
	          }
	          return done(null, newUser);
	        });
	      }
	    });
	  });
	}
));
// Facebook login
passport.use(new FacebookStrategy({
    clientID: '264292990672562',
    clientSecret: facebookAppSecret,
    callbackURL: process.env.PORT ? null : 'http://127.0.0.1:3000/login/facebook/callback',
  },
	function(token, refreshToken, profile, done) {
		process.nextTick(function() {
			User.findOne({ 'facebookId' : profile.id }, function(err, user) {
				if (err) return done(err);
				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();
					newUser.name = profile.displayName;
					newUser.facebookId = profile.id;
					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}
));
// Google login
passport.use(new GoogleStrategy({
    clientID: '906915295802-pq35f3ve2mubddbul0hab46s8tok9nom.apps.googleusercontent.com',
    clientSecret: googleAppSecret,
    callbackURL: process.env.PORT ? null : 'http://127.0.0.1:3000/login/google/callback',
  },
	function(token, refreshToken, profile, done) {
		process.nextTick(function() {
			User.findOne({ 'google.id' : profile.id }, function(err, user) {
				if (err) return done(err);
				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();
					newUser.name = profile.displayName;
					newUser.googleId = profile.id;
					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}
));
	

passport.serializeUser(function(user, cb) {
  cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));


function loggedIn(req, res, next) {
	//onsole.log(req.user);
  if (req.user) {
    next();
  } else {
    res.redirect('/login/twitter');
  }
}


/* --- ROUTES --- */
// Home page
app.get('/', function(req, res) {
	res.render('index.ejs', {regMessage: 'none'});
});
// Blog routes
require('./mods/blogRoutes')(app);
// Email support form
app.post('/support', emailSupport);
// Account page
app.get('/account', function(req, res) {
	res.render('account.ejs');
});
// Privacy policy
app.get('/privacy-policy', function(req, res) {
	res.render('privacy-policy.ejs');
});


// Local login
app.post('/local-login', function(req, res) {
	User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
		if (!user) {
			res.render('login.ejs', {error: 'Invalid email or password.'});
		} else {
			if (bcrypt.compareSync(req.body.password, user.password)) {
				req.session.user = user;
				console.log(req.session.user);
				res.redirect('/profile');
			} else {
				console.log(req.body.email.toLowerCase() + ' entered an incorrect password or username');
				//res.render('login.ejs', { reset: 'none', error: 'Invalid email or password.'});				
			}
		}
	});
});




// Recipes page
app.get('/recipes', loggedIn, function(req, res) {
  Recipe.find({user_id: req.user._id}, function(err, recipes) {
  	if (err) throw err;
  	console.log(req.user._id + '\'s recipes retrieved!');
  	res.render('recipes.ejs', {recipes: recipes, loginId: req.user._id.toString()});
  });
});

// Get all recipes
app.get('/get-all-recipes', function(req, res) {
  console.log('/get-all-recipes');
  Recipe.find({user_id: req.user._id}, function(err, recipes) {
  	if (err) throw err;
  	console.log(req.user._id + '\'s recipes retrieved!');
  	res.json(recipes);
  });
});



// Add or update recipe
app.post('/recipe-update', function(req, res) {
	// Favorite recipe
  if (req.body.favoriteType) {
    var favoriteValue = req.body.favoriteType === 'add' ? true : false;
  	Recipe.findOne({user_id: req.user._id, _id: req.body.id}, function(err, recipe) {
    	recipe.favorite = favoriteValue;
			recipe.save(function(err, recipe) {
			  if (err) throw err;
			  console.log(recipe.recipeName + ' favorited!');
    		res.json({});
			});
  	});
  }


	// Save new recipe
  if (req.body.isNew) {
		var recipe = new Recipe({
			user_id: req.user._id,
			recipeName: req.body.recipeName,
			ingredients: req.body.ingredients,
			description: req.body.description,
			url: req.body.url,
			tags: [],
			servings: req.body.servings,
			readyIn: req.body.readyIn,
			cals: req.body.cals,
			favorite: false,
		});
    if (req.body.tags) {
      handleTagsAndSave(req.user._id, req.body.tags, recipe, res);
    } else {
			recipe.save(function(err, recipe) {
			  if (err) throw err;
			  console.log(recipe.recipeName + ' saved!');
			  res.json(recipe);
			});
	    return;
    }
  }

});
function handleTagsAndSave(userId, requestTags, recipe, res) {
  // Set default new color
  var color = '#808080';
  Recipe.find({user_id: userId}, function(err, recipes) {
  	if (err) throw err;
		var tags = [];
	  requestTags.forEach(function(el, pos) {
	    for (var i = 0; i < recipes.length; i++) {
	      for (var j = 0; j < recipes[i].tags.length; j++) {
	        if (requestTags[pos].name === recipes[i].tags[j].name) {
	          color = recipes[i].tags[j].color;
	          break;
	        } else if (requestTags[pos].color) {
	          color = requestTags[pos].color;
	        }
	      }
	    }
	    recipe.tags.push({'name': requestTags[pos].name, 'color': color});
	    // Reset color
	    color = '#808080';
	  });
		recipe.save(function(err, recipe) {
		  if (err) throw err;
		  console.log(recipe.recipeName + ' saved!');
		  res.json(recipe);
		});
  });
}


// Get favorite recipes
app.get('/get-favorite-recipes', function(req, res) {
  console.log('/get-favorite-recipes');
  Recipe.find({user_id: req.user._id, favorite: true}, function(err, recipes) {
  	if (err) throw err;
  	res.json(recipes);
  });
});


// Get uncategorized recipes
app.get('/get-uncategorized-recipes', function(req, res) {
  console.log('/get-uncategorized-recipes');
  Recipe.find({user_id: req.user._id, tags: {$size: 0} }, function(err, recipes) {
  	if (err) throw err;
  	res.json(recipes);
  });
});






// Get all tags
app.get('/get-all-tags', function(req, res) {
  console.log('/get-all-tags');
  Recipe.find({user_id: req.user._id}, function(err, recipes) {
  	if (err) throw err;
	  // First get all user-defined tags
	  var uniqueTags = [];
	  for (var i = 0; i < recipes.length; i++) {
	    for (var j = 0; j < recipes[i].tags.length; j++) {
	      pushIfNew(uniqueTags, recipes[i].tags[j]);
	    }
	  }
	  res.json(uniqueTags);
  });
});


// Get recipes by tag
app.post('/get-recipes-by-tag', function(req, res) {
  console.log('/get-recipes-by-tag');

  var tagName = req.body.tagName;
  var tagColor = req.body.tagColor;
  var recipesToSend = [];

  Recipe.find({user_id: req.user._id}, function(err, recipes) {
  	if (err) throw err;
	  for (var i = 0; i < recipes.length; i++) {
	    for (var j = 0; j < recipes[i].tags.length; j++) {
	      if (recipes[i].tags[j].name === tagName) {
	        recipesToSend.push(recipes[i]);
	      }
	    }
	  }
	  res.json({recipesToSend: recipesToSend, tagColor: tagColor, tagName: tagName});
  });
});


// Update tag color
app.post('/update-tag-color', function(req, res) {
	var tagColorToChange = req.body.tagColorToChange;
	var newTagColor = req.body.newTagColor;
	var tagName = req.body.tagName;
	console.log(tagName);

  Recipe.find({user_id: req.user._id}, function(err, recipes) {
  	if (err) throw err;

  	var recipesToSave = [];
		for (var i = 0; i < recipes.length; i++) {
			for (var j = 0; j < recipes[i].tags.length; j++) {
				if (recipes[i].tags[j].color === tagColorToChange && recipes[i].tags[j].name === tagName) {

					recipes[i].tags[j].color = newTagColor;

					// For some reason, MongoDB is not saving updated tag colors unless we set the recipe tags to an entirely different value first and then resetting the value to the changed tag array
					var clonedTags = recipes[i].tags.slice(0);
					recipes[i].tags = [];
					recipes[i].tags = clonedTags;

					recipesToSave.push(recipes[i]);
				}
			}
		}

		if (recipesToSave.length == 0) {
			res.sendStatus(200);
		} else {
			var counter = 0;
			for (var k = 0; k < recipesToSave.length; k++) {
				console.log(recipesToSave[k])
				recipesToSave[k].save(function(err, record) {
				  if (err) throw err;
				  console.log('Saving ' + record.recipeName);
				  counter++;
				});
			}

			// Wait until all records in the recipesToSave array are finished saving then send the response
			(function poll() {
				setTimeout(function () {
					if (counter === recipesToSave.length) {
						res.json(recipes);
					} else {
						poll();
					}
				}, 50);
			})();
		}
  });
});



// Delete recipe
app.post('/delete-recipe', function(req, res) {
  Recipe.remove({user_id: req.user._id, _id: req.body.id}, function(err, recipe) {
  	if (err) throw err;
  	console.log('Recipe id: ' + req.body.id + ' was deleted');
		res.sendStatus(200);
  });
});


// Login with Twitter
app.get('/login/twitter', passport.authenticate('twitter'));
app.get('/login/twitter/return', passport.authenticate('twitter', { session: true, failureRedirect: '/login' }), function(req, res) {
  console.log('Successful Twitter authentication, redirect home.');
	res.redirect('/#from-twitter');
});
app.get('/login/facebook',
  passport.authenticate('facebook'));
app.get('/login/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('Successful Facebook authentication, redirect home.');
    res.redirect('/');
  });
app.get('/login/google',
  passport.authenticate('google', { scope: ['profile'] }));
app.get('/login/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('Successful Google authentication, redirect home.');
    res.redirect('/');
  });

app.get('/checklogin', loggedIn, function(req, res) {
  res.sendStatus(200);
});
app.get('/logout', function(req, res) {
	req.session.destroy();
  res.sendStatus(200);
});






app.post('/recipe', function(req, res) {
  var recipeToUpdate = getRecipe(req.body.id);
  res.json(recipeToUpdate);
});





// app.post('/recipe-update', function(req, res) {
//   if (req.body.favoriteType) {

//     var favoriteValue = req.body.favoriteType === 'add' ? true : false;
//     var recipeToUpdate = getRecipe(req.body.id);
//     recipeToUpdate.favorite = favoriteValue;
//     res.json({});
//     return;
//   }


//   if (req.body.isNew) {

//     var recipeIDs = recipes.map(function(i) {
//       return i.id;
//     });

//     var newRecipe = {
//       id: Math.max.apply(null, recipeIDs) + 1,
//       name: req.body.recipeName,
//       ingredients: req.body.ingredients,
//       more: req.body.recipeDescription,
//       url: req.body.url,
//       servings: req.body.servings,
//       readyIn: req.body.readyIn,
//       cals: req.body.cals,
//       tags: [],
//       date: '1/11/17'
//     };

//     if (req.body.tags) {
//       handleTags(req.body.tags, newRecipe);
//     }

//     recipes.push(newRecipe);
//     res.json(newRecipe);
//     return;
//   }


//   console.log(req.body.id);
//   var recipeToUpdate = getRecipe(req.body.id);

//   // Update recipe name
//   if (req.body.recipeName) {
//     recipeToUpdate.name = req.body.recipeName;
//   }

//   // Update ingredients
//   if (req.body.ingredients) {
//   	console.log('Updating recipe ingredients');
//   	console.log(req.body.ingredients);
//   	recipeToUpdate.ingredients = req.body.ingredients
//   }

//   // Update recipe description
//   if (req.body.recipeDescription) {
//     recipeToUpdate.more = req.body.recipeDescription;
//   }

//   // Update tags
//   if (req.body.tags) {

//     var submittedTags = req.body.tags;

//     // Clear existing tags
//     recipeToUpdate.tags = [];

//     handleTags(submittedTags, recipeToUpdate);
//   }

//   // Update URL
//   if (req.body.url === '' || req.body.url) {
//   	recipeToUpdate.url = req.body.url;
//   }

//   // Update servings
//   if (req.body.servings) {
//     recipeToUpdate.servings = req.body.servings;
//   }

//   // Update ready time
//   if (req.body.readyIn) {
//     recipeToUpdate.readyIn = req.body.readyIn;
//   }

//   // Update calories
//   if (req.body.cals) {
//     recipeToUpdate.cals = req.body.cals;
//   }

//   res.json(recipeToUpdate);
// });


// function handleTags(arr, recipe) {
//   // Set default new color
//   var color = '#808080';

//   arr.forEach(function(el, pos) {
//     for (var i = 0; i < recipes.length; i++) {
//       for (var j = 0; j < recipes[i].tags.length; j++) {
//         if (arr[pos].name === recipes[i].tags[j].name) {
//           color = recipes[i].tags[j].color;
//           break;
//         } else if (arr[pos].color) {
//           color = arr[pos].color;
//         }
//       }
//     }

//     recipe.tags.push({'name': arr[pos].name, 'color': color});

//     // Reset color
//     color = '#808080';
//   });
// }




app.listen(process.env.PORT || 3000, function() {
	console.log('App listening on port 3000');
});


/* --- Helper functionss --- */
// Temporary function to get a recipe by id
function getRecipe(id) {
  return recipes.filter(function(v) {
    return v.id == id;
  })[0];
}

// Temporary function to push only unique vales into a specified array
function pushIfNew(arr, obj) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].name === obj.name) {
      return;
    }
  }
  arr.push(obj);
}




var recipes = [
	{
		"id": 1,
		"name": "Pasta",
		"url": "http://www.thedoctorstv.com/recipes/dr-travis-dark-chocolate-mousse",
		"ingredients": ["1 tsp. Olive Oil", ".5 Cups Chile Powder", ".75 tablespoon tomato"],
		"more": "Boil potatoes about 12 to 15 minutes. Drain, slice them up. Slice or chop a medium onion. Heat about 1/4\" of oil in frying pan. When hot, add potatoes and spread them out. Allow them to start to brown before flipping/turning. From this point on, keep turning once in a while until they look like you want them. Keep enough oil in the pan. Also, add the onion after that first turn. If you add sooner, the onions will start to burn. Sometimes I sprinkle with a little paprika, but always with black pepper (to taste). Also add salt to taste. If you have to, drain them on paper towels on newspaper, but if you do it right you shouldn't have to do that.",
			"tags": [{"name": "dinner", "color": "#2c77ff"}, {"name": "lunch", "color": "#ff0000"}],
			date: '6/6/15',
      readyIn: 335,
      cals: '2000',
      servings: 1,
      favorite: true,
	},
	{
		"id": 2,
		"name": "Eggs",
		"url": "https://www.youtube.com/watch?v=z15ipHV4Now",
		"ingredients": ["12 cups water"],
		"more": "Chicken coated in panko bread crumbs and hot wing sauce, deep fried, and glazed over with swiss cheese or season with spices",
		"tags": [{"name": "breakfast", "color": "#22da00"}, {"name": "to try", "color": "#ff0000"}],
		date: '11/7/16',
    readyIn: 60,
    cals: '1500',
    servings: 4,
    favorite: false,
	},
  {
    "id": 3,
    "name": "Soup",
    "url": "http://www.rachaelray.com/recipes/tournedos-pizzaiola-on-charred-ciabatta",
		"ingredients": ["1 ripe apple", "2 peppers"],
    "more": "Mix Parmesan cheese, melted butter, mayonnaise, green onions, and 2 tablespoons lemon juice in a bowl; spoon over the fillets.",
      "tags": [{"name": "dinner", "color": "#2c77ff"}, {"name": "lunch", "color": "#ff0000"}, {"name": "random", "color": "#2c77ff"}],
      date: '1/13/14',
      readyIn: 45,
      cals: '70',
      servings: 8,
      favorite: false,
  },
  {
    "id": 4,
    "name": "Cream Cheese Penguins",
    "url": "",
		"ingredients": ["1 cup milk", "2 cups bread"],
    "more": "Cut a slit from top to bottom, lengthwise, into the side of each jumbo olive. Carefully insert about 1 teaspoon of cream cheese into each olive. Slice the carrot into eighteen 1/4 inch thick rounds; cut a small notch out of each carrot slice to form feet. Save the cut out piece and press into center of small olive to form the beak. If necessary cut a small slit into each olive before inserting the beak.",
      "tags": [{"name": "dinner", "color": "#2c77ff"}, {"name": "brunch", "color": "#ffa500"}],
      date: '11/8/16',
      readyIn: 175,
      cals: '140',
      servings: 6,
      favorite: false,
  },
  {
    "id": 5,
    "name": "Veal Piccata",
    "url": "http://www.health.com/health/recipe/0,,10000000522028,00.html",
		"ingredients": ["water", "1 tablespoon sauce", "5 carrots"],
    "more": "In a shallow bowl or plate combine the flour, 1 1/2 teaspoons of the salt and pepper and stir to combine thoroughly. Quickly dredge the veal scallops in the seasoned flour mixture, shaking to remove any excess flour",
      "tags": [{"name": "dinner", "color": "#2c77ff"}, {"name": "brunch", "color": "#ffa500"}],
      date: '12/2/15',
      readyIn: 75,
      cals: '575',
      servings: 2,
      favorite: true,
  },
  {
    "id": 6,
    "name": "Fake Cake",
    "url": "http://allrecipes.com/recipe/231379/crazy-delicious-turkey-meatloaf/?internalSource=rotd&referringContentType=home%20page&clickId=cardslot%201",
		"ingredients": ["1 tsp. beer"],
    "more": "",
    "tags": [],
    date: '12/9/15',
    readyIn: 23,
    cals: '',
    servings: 1,
    favorite: true,
  },
  {
    "id": 7,
    "name": "Fake Cake2",
    "url": "http://allrecipes.com/recipe/231379/crazy-delicious-turkey-meatloaf/?internalSource=rotd&referringContentType=home%20page&clickId=cardslot%201",
    "ingredients": ["1 tsp. beer"],
    "more": "",
    "tags": [],
    date: '3/9/16',
    readyIn: 23,
    cals: '',
    servings: 1,
    favorite: false,
  },
  {
    "id": 8,
    "name": "Roasted Rack of Lamb",
    "url": "http://allrecipes.com/recipe/45641/roasted-rack-of-lamb/?internalSource=hub%20recipe&referringContentType=search%20results&clickId=cardslot%202",
    "ingredients": ["1/2 cup fresh bread crumbs", "2 tablespoons minced garlic", "2 tablespoons chopped fresh rosemary", "1 teaspoon salt", "1/4 teaspoon black pepper", "2 tablespoons olive oil", "1 (7 bone) rack of lamb, trimmed and frenched", "1 teaspoon salt", "1 teaspoon black pepper", "2 tablespoons olive oil"],
    "more": "Preheat oven to 450 degrees F (230 degrees C). Move oven rack to the center position. In a large bowl, combine bread crumbs, garlic, rosemary, 1 teaspoon salt and 1/4 teaspoon pepper. Toss in 2 tablespoons olive oil to moisten mixture. Set aside. Season the rack all over with salt and pepper. Heat 2 tablespoons olive oil in a large heavy oven proof skillet over high heat. Sear rack of lamb for 1 to 2 minutes on all sides. Set aside for a few minutes. Brush rack of lamb with the mustard. Roll in the bread crumb mixture until evenly coated. Cover the ends of the bones with foil to prevent charring.Arrange the rack bone side down in the skillet. Roast the lamb in preheated oven for 12 to 18 minutes, depending on the degree of doneness you want. With a meat thermometer, take a reading in the center of the meat after 10 to 12 minutes and remove the meat, or let it cook longer, to your taste. Let it rest for 5 to 7 minutes, loosely covered, before carving between the ribs.",
    "tags": [{"name": "dinner", "color": "#2c77ff"}, {"name": "holiday", "color": "#ff05d6"}],
    date: '1/17/17',
    readyIn: 90,
    cals: '2000',
    servings: 4,
    favorite: true,
  },
];
