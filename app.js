var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');


passport.use(new Strategy({
    consumerKey: 'sujQmls5lvQVViAog5HTmNr6Z',
    consumerSecret: 'jrUKqLcG08JyRRHjlfrsnrSmy8NIDH9CSMkTzYKXDSiClOjaFa',
    callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
  },
  function(token, tokenSecret, profile, cb) {

    return cb(null, profile);
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();
app.set('view engine', 'ejs');

// Configure view engine to render EJS templates.
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
// app.use(require('cookie-parser')());
// app.use(require('body-parser').urlencoded({ extended: true }));
//app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// // Initialize Passport and restore authentication state, if any, from the
// // session.
app.use(session({ secret: 'anything' }));
app.use(passport.initialize());
app.use(passport.session());




// Define routes.
// app.get('/',
//   function(req, res) {
//     res.render('home', { user: req.user });
//   });

// app.get('/login',
//   function(req, res){
//     res.render('login');
//   });


function loggedIn(req, res, next) {
  if (req.user) {
    console.log('yes');
    next();
  } else {
    console.log('no');
    res.sendStatus(401);
  }
}

// Login with Twitter
app.get('/login/twitter', passport.authenticate('twitter'));

app.get('/login/twitter/return', passport.authenticate('twitter', { session: true, failureRedirect: '/login' }), function(req, res) {
  console.log('User has been authenticated!');
	res.redirect('/#profile');
});

app.get('/checklogin', /*loggedIn,*/ function(req, res) {
  //console.log(req.user);
  res.sendStatus(200);
});



app.get('/recipes', function(req, res) {
	console.log('/recipes');
	res.json(recipes);
});

app.post('/update', function(req, res) {
  var recipeToUpdate = recipes.filter(function(v) {
	  return v.id == req.body.id;
	})[0];

  if (req.body.category === 'recipeMore') {
    console.log('updating recipeMore')
    recipeToUpdate.more = req.body.recipeMore;
  } else if (req.body.category === 'recipeName') {
    console.log('updating recipeName')
    recipeToUpdate.name = req.body.recipeName;
  } else if (req.body.category === 'tag') {
  	console.log('adding tag');
  	recipeToUpdate.tags.push({"id": Math.random() * 1000, "name": req.body.tag, "color": "red"});
  } 

  


  res.sendStatus(200);
});





app.get('/', function(req, res) {
	res.render('index.ejs', {regMessage: 'none'});
});


app.get('/profile', function(req, res) {
  res.render('profile.ejs', {recipes: recipes});
});

app.post('/recipe', function(req, res) {
  var recipeToUpdate = getRecipe(req.body.id);
  res.json(recipeToUpdate);
});

app.post('/recipe-update', function(req, res) {
  var recipeToUpdate = getRecipe(req.body.id);

  // Add new tag
  if (req.body.tagName) {
    recipeToUpdate.tags.push({"id": Math.random() * 1000, "name": req.body.tagName, "color": "red"});
  }

  // Update recipe name
  if (req.body.recipeName) {
    recipeToUpdate.name = req.body.recipeName;
  }

  // Update recipe description
  if (req.body.recipeDescription) {
    recipeToUpdate.more = req.body.recipeDescription;
  }

  if (req.body.tagToRemove) {
    recipeToUpdate.tags = recipeToUpdate.tags.filter(function(e) {
      return e.id != req.body.tagToRemove;
    });
  }


  res.json(recipeToUpdate);
});

// Get all tags
app.get('/get-all-tags', function(req, res) {
  console.log('/get-all-tags');

  // First get all user-defined tags
  var uniqueTags = [];
  for (var i = 0; i < recipes.length; i++) {
    for (var j = 0; j < recipes[i].tags.length; j++) {
      pushIfNew(uniqueTags, recipes[i].tags[j]);
    }
  }

  console.log(uniqueTags)
  res.json(uniqueTags);
});


// Get recipes by tag
app.post('/get-recipes-by-tag', function(req, res) {
  console.log('/get-recipes-by-tag');
  var tagName = req.body.tagName;
  var tagColor = req.body.tagColor;
  var recipesToSend = [];

  for (var i = 0; i < recipes.length; i++) {
    for (var j = 0; j < recipes[i].tags.length; j++) {
      if (recipes[i].tags[j].name === tagName) {
        recipesToSend.push(recipes[i]);
      }
    }
  }

  res.json({recipesToSend: recipesToSend, tagColor: tagColor, tagName: tagName});
});


// Get all recipes
app.get('/get-all-recipes', function(req, res) {
  console.log('/get-all-recipes');
  res.json(recipes);
});

// Update tag color
app.post('/update-tag-color', function(req, res) {
	var tagColorToChange = req.body.tagColorToChange;
	var newTagColor = req.body.newTagColor;
	var tagName = req.body.tagName;
	console.log(tagName);

	for (var i = 0; i < recipes.length; i++) {
		for (var j = 0; j < recipes[i].tags.length; j++) {
			if (recipes[i].tags[j].color === tagColorToChange && recipes[i].tags[j].name === tagName) {
				recipes[i].tags[j].color = newTagColor;
			}
		}
	}

	res.sendStatus(200);

});


app.listen(3000, function() {
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
		"ingredients": "pasta, tomato",
		"more": "Boil potatoes about 12 to 15 minutes. Drain, slice them up. Slice or chop a medium onion. Heat about 1/4\" of oil in frying pan. When hot, add potatoes and spread them out. Allow them to start to brown before flipping/turning. From this point on, keep turning once in a while until they look like you want them. Keep enough oil in the pan. Also, add the onion after that first turn. If you add sooner, the onions will start to burn. Sometimes I sprinkle with a little paprika, but always with black pepper (to taste). Also add salt to taste. If you have to, drain them on paper towels on newspaper, but if you do it right you shouldn't have to do that.",
			"tags": [{"id": 1, "name": "dinner", "color": "#2c77ff"}, {"id": 2, "name": "lunch", "color": "#ff0000"}]
	},
	{
		"id": 2,
		"name": "Eggs",
		"ingredients": "eggs, stuff",
		"more": "Chicken coated in panko bread crumbs and hot wing sauce, deep fried, and glazed over with swiss cheese or season with spices",
		"tags": [{"id": 1, "name": "breakfast", "color": "#22da00"}, {"id": 2, "name": "to try", "color": "#ff0000"}]
	},
  {
    "id": 3,
    "name": "Soup",
    "ingredients": "beets, water",
    "more": "Mix Parmesan cheese, melted butter, mayonnaise, green onions, and 2 tablespoons lemon juice in a bowl; spoon over the fillets.",
      "tags": [{"id": 1, "name": "dinner", "color": "#2c77ff"}, {"id": 2, "name": "lunch", "color": "#ff0000"}]
  },
  {
    "id": 4,
    "name": "Cream Cheese Penguins",
    "ingredients": "olives, carrot",
    "more": "Cut a slit from top to bottom, lengthwise, into the side of each jumbo olive. Carefully insert about 1 teaspoon of cream cheese into each olive. Slice the carrot into eighteen 1/4 inch thick rounds; cut a small notch out of each carrot slice to form feet. Save the cut out piece and press into center of small olive to form the beak. If necessary cut a small slit into each olive before inserting the beak.",
      "tags": [{"id": 1, "name": "dinner", "color": "#dec688"}, {"id": 2, "name": "brunch", "color": "#ffa500"}]
  },
  {
    "id": 5,
    "name": "Veal Piccata",
    "ingredients": "milk, veal",
    "more": "In a shallow bowl or plate combine the flour, 1 1/2 teaspoons of the salt and pepper and stir to combine thoroughly. Quickly dredge the veal scallops in the seasoned flour mixture, shaking to remove any excess flour",
      "tags": [{"id": 1, "name": "dinner", "color": "#dec688"}, {"id": 2, "name": "brunch", "color": "#ffa500"}]
  },
];