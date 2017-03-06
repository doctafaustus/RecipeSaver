var express = require('express');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LocalStrategy = require('passport-local').Strategy;
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
var uriUtil = require('mongodb-uri');
var Schema = mongoose.Schema; //allows use to define our schema
var ObjectId = Schema.ObjectId;
var dbOptions = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };
var MongoStore = require('connect-mongo')(session);
mongoose.Promise = global.Promise; // Removes decprecation warning



// Connect to DB
if (!process.env.PORT) {
	mongoose.connect('mongodb://localhost/recipe_saver');
} else {
	console.log("Application running in Heroku!");
	var mongodbUri = process.env.MONGODB_URI; // A Heroku config variable
	var mongooseUri = uriUtil.formatMongoose(mongodbUri);
	console.log('mongodbUri: ' + mongodbUri);
	console.log(mongooseUri);
	mongoose.connect(mongooseUri, dbOptions);
}


var User = mongoose.model('User', new Schema({
	id: ObjectId,
	email: String,
	password: String,
	name: String,
	twitterId: String,
	facebookId: String,
	googleId: String,
	subscription: String,
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
var checkCaptcha = require('./mods/checkCaptcha.js');
var sendEmail = require('./mods/sendEmail.js');

var twitterAppSecret = process.env.PORT ? null : fs.readFileSync('./private/twitterAppSecret.txt').toString();
var facebookAppSecret = process.env.PORT ? null : fs.readFileSync('./private/facebookAppSecret.txt').toString();
var googleAppSecret = process.env.PORT ? process.env.GOOGLEAPPSECRET : fs.readFileSync('./private/googleAppSecret.txt').toString();


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
	    User.findOne({ 'twitterId': profile.id }, function(err, user) {
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
			User.findOne({ 'facebookId': profile.id }, function(err, user) {
				if (err) return done(err);
				if (user) {
					return done(null, user);
				} else {
					console.log('Creating new Facebook user');
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
    callbackURL: process.env.PORT ? 'https://recipesavertest.herokuapp.com/login/google/callback' : 'http://127.0.0.1:3000/login/google/callback',
  },
	function(token, refreshToken, profile, done) {
		process.nextTick(function() {
			User.findOne({ 'googleId': profile.id }, function(err, user) {
				if (err) return done(err);
				if (user) {
					console.log('FOUND Google user, logging in...');
					return done(null, user);
				} else {
					console.log('Creating new Google user');
					var newUser = new User();
					newUser.name = profile.displayName;
					newUser.googleId = profile.id;
					newUser.subscription = 'Free',
					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}
));

// Local login
passport.use(new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true,
	},
	function(req, email, password, done) {
		// The email parameter is really req.body.email
	  process.nextTick(function() {
	  	if (req.body.reqType === 'register') {
		    User.findOne({ 'email':  email }, function(err, user) {
		      if (err) return done(err);
		      if (user) {
		        console.log(req.body.email + ' is already registered');
		        return done(null, false); // A 401 error will be returned
		      } else { // Otherwise, save new user
		      	var hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
						var newUser = new User();
						newUser.name = req.body.name;
						newUser.email = req.body.email;
						newUser.password = hash;
						newUser.save(function(err) {
		          if (err) throw err;
		          console.log('Saving ' + req.body.email);
		          return done(null, newUser);
		        });
		      }
		    });
	  	} else if (req.body.reqType === 'login') {
				User.findOne({ 'email': email }, function(err, user) {
					if (err) return done(err);
					if (!user) {
						console.log(req.body.email + ' incorrect username or password');
						return done(null, false);
					}
					if (bcrypt.compareSync(req.body.password, user.password)) {
						console.log('found user!');
						return done(null, user);
					} else {
						console.log(req.body.email + ' incorrect username or password');
						return done(null, false);
					}
				});
	  	}
	  });
	}
));

passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
  	console.log('User not logged in');
   	res.render('login.ejs', {message: 'Please log in to continue'});
  }
}


// Create a new Express application.
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// Configure MongoStore options
// This enables users to stay logged in even if the server goes down
var mongoStoreOptions;
if (!process.env.PORT) {
	mongoStoreOptions = {
		url: 'mongodb://localhost/recipe-saver',
	};
} else {
	mongoStoreOptions = {
		url: 'mongodb://heroku_72l62tzb:9clcc3c57hc5j3jruvca8btah@ds127399.mlab.com:27399/heroku_72l62tzb',
		ttl: 365 * 24 * 60 * 60,
	};
}

app.use(function(req, res, next) {
res.header('Access-Control-Allow-Credentials', true);
res.header('Access-Control-Allow-Origin', req.headers.origin);
res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
if ('OPTIONS' == req.method) {
     res.send(200);
 } else {
     next();
 }
});


app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true, store: new MongoStore(mongoStoreOptions) }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));

// Listen
app.listen(process.env.PORT || 3000, function() {
	console.log('App listening on port 3000');
});




app.post('/register', checkCaptcha, passport.authenticate('local', { session: true }), sendEmail(require('./mods/registrationEmail.js'), 'registration'), function(req, res){
  	console.log('done registering!');
  	res.sendStatus(200);
});
app.post('/login', passport.authenticate('local', { session: true }), function(req, res){
  	console.log('done logging in!');
  	res.sendStatus(200);
});

// Account page
app.get('/account', loggedIn, function(req, res) {
	console.log('/account');
	console.log(req.user);
	res.render('account.ejs', {accountInfo: req.user});
});
app.post('/delete-account', loggedIn, function(req, res) {
	console.log('/delete-account');
  Recipe.remove({user_id: req.user._id}, function(err, recipe) {
  	if (err) throw err;
  	console.log(req.user._id + '\'s recipes deleted!');
	  User.remove({_id: req.user._id}, function(err, recipe) {
	  	if (err) throw err;
			console.log(req.user._id + ' deleted from db!');
			res.sendStatus(200);
	  });
  });
});


// Chrome Extension Testing
app.post('/extension', function(req, res) {
	console.log('/extension');
	console.log(req.user);
});



/* --- ROUTES --- */
// Home page
app.get('/', function(req, res) {
	res.render('index.ejs', {regMessage: 'none'});
});
app.get('/home', function(req, res) {
	res.render('home.ejs');
});
app.get('/register', function(req, res) {
	res.render('register.ejs');
});
app.get('/login', function(req, res) {
	res.render('login.ejs');
});
// Blog routes
require('./mods/blogRoutes')(app);
// Email support form
app.post('/support', checkCaptcha, sendEmail(require('./mods/supportEmail.js'), 'support'));
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

// Login with Twitter
app.get('/login/twitter', passport.authenticate('twitter'));
app.get('/login/twitter/return', passport.authenticate('twitter', { session: true, failureRedirect: '/login' }), function(req, res) {
  console.log('Successful Twitter authentication, redirect home.');
	res.redirect('/account');
});
app.get('/login/facebook',
  passport.authenticate('facebook'));
app.get('/login/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('Successful Facebook authentication, redirect home.');
    res.redirect('/account');
  });
app.get('/login/google',
  passport.authenticate('google', { scope: ['profile'] }));
app.get('/login/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('Successful Google authentication, redirect home.');
    res.redirect('/account');
  });

app.get('/checklogin', loggedIn, function(req, res) {
  res.sendStatus(200);
});
app.get('/logout', function(req, res) {
	req.session.destroy();
  res.redirect('/login');
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

// Get a single recipe from the database
app.post('/recipe', function(req, res) {
  Recipe.findOne({user_id: req.user._id, _id: req.body.id}, function(err, recipe) {
  	if (err) throw err;
		console.log(recipe.recipeName + ' retrieved from db!');
		res.json(recipe);
  });
});

// Add or update recipe
app.post('/recipe-update', function(req, res) {
	// Favorite recipe
  if (req.body.favoriteType) {
    var favoriteValue = req.body.favoriteType === 'add' ? true : false;
  	Recipe.findOne({user_id: req.user._id, _id: req.body.id}, function(err, recipe) {
  		if (err) throw err;

    	recipe.favorite = favoriteValue;
			recipe.save(function(err, recipe) {
			  if (err) throw err;
			  console.log(recipe.recipeName + ' favorited!');
    		res.json(recipe);
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
  } else {
	  // Edit recipe
		Recipe.findOne({user_id: req.user._id, _id: req.body.id}, function(err, recipe) {
			if (err) throw err;

			if (req.body.recipeName) {
				recipe.recipeName = req.body.recipeName;
			}
			if (req.body.description) {
				recipe.description = req.body.description;
			}
			if (req.body.ingredients) {
				recipe.ingredients = req.body.ingredients
			}
		  if (req.body.url === '' || req.body.url) {
		  	recipe.url = req.body.url;
		  }
		  if (req.body.servings) {
		    recipe.servings = req.body.servings;
		  }
		  if (req.body.readyIn) {
		    recipe.readyIn = req.body.readyIn;
		  }
		  if (req.body.cals) {
		    recipe.cals = req.body.cals;
		  }
		  if (req.body.tags) {
	      handleTagsAndSave(req.user._id, req.body.tags, recipe, res, true);
		  } else {
				recipe.save(function(err, recipe) {
				  if (err) throw err;
				  console.log(recipe.recipeName + ' saved!');
				  res.json(recipe);
				});
		    return;
		  }
		});
  }
});

function handleTagsAndSave(userId, requestTags, recipe, res, isEdit) {
  // Set default new color
  var color = '#808080';
  Recipe.find({user_id: userId}, function(err, recipes) {
  	if (err) throw err;

  	if (isEdit) {
  		recipe.tags = [];
  	}

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
		  console.log(recipe.recipeName + ' saved with tag check!');
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
	console.log('Updating color of: ' + tagName);

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


/* --- Helper functionss --- */
// Pushes only unique vales into a specified array
function pushIfNew(arr, obj) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].name === obj.name) {
      return;
    }
  }
  arr.push(obj);
}