var units = [
	{
		type: 'teaspoon', values: ['tsp', 'ts', 'tsps', 'teaspoon', 'teaspoons'],
	},
	{
		type: 'tablespoon', values: ['tbsp', 'tbsps', 'tablespoon', 'tablespoons'],
	},
	{
		type: 'ounce', values: ['oz', 'ounce', 'ounces', 'fl-oz', 'fl oz', 'floz', 'fluid ounce', 'fl. oz.', 'oz. fl.', 'oz fl'],
	},
	{
		type: 'cup', values: ['c', 'cup', 'cups'],
	},
	{
		type: 'pint', values: ['pt', 'pint', 'pints', 'pnt'],
	},
	{
		type: 'quart', values: ['qt', 'quart', 'quarts', 'qrt'],
	},
	{
		type: 'gallon', values: ['gal', 'gallon', 'gallons', 'gln'],
	},
	{
		type: 'litre', values: ['l', 'litre', 'litres', 'ltr'],
	},
	{
		type: 'milliliter', values: ['ml', 'millilitre', 'millilitres'],
	},
	{
		type: 'milligram', values: ['mg', 'milligram', 'milligrams', 'mgrams'],
	},
	{
		type: 'gram', values: ['g', 'gram', 'grams'],
	},
	{
		type: 'kilogram', values: ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'],
	},
	{
		type: 'ounceWeight', values: ['oz', 'ounce', 'ounces'],
	},
	{
		type: 'pound', values: ['lb', 'lbs', 'pound', 'pounds'],
	},
	{
		type: 'inch', values: ['in', 'inch', 'inches', '"'],
	},
	{
		type: 'foot', values: ['ft', 'foot', 'feet', "'"],
	},
	{
		type: 'yard', values: ['yd', 'yds', 'yard', 'yards'],
	},
	{
		type: 'millimeter', values: ['mm', 'millimeter', 'millimeters'],
	},
	{
		type: 'centimeter', values: ['cm', 'centimeter', 'centimeters'],
	},
	{
		type: 'decimeter', values: ['dc', 'decimeter', 'decimeters'],
	},
	{
		type: 'meter', values: ['m', 'meter', 'meters'],
	}
];

var allowedFractions = ['1', '1/2', '1/4', '1/8', '2/3', '1/16', '1/3', '1/5', '1/10', '3/4', '5/8'];


// The lowest possible conversion is 1/8 teaspoon - nothing lower than that

$('.ingredient').each(function() {
	// Initialize object
	var obj = { unitType: null, unitValue: null, ingredient: $(this).find('input').val().match(/[a-zA-z].*/)[0] };

	var str = $(this).find('input').val().toLowerCase();
	obj.unitType = getUnitType(str);

	// First detect if there is a whole number with a fraction, like "1 1/2"
	var digit = detectWholeWithFraction(str);

	// If a whole number with a fraction was not detected then search normally
	if (!digit) {
		var digits = str.match(/^\s*([\.\/\d-]+) \w/);
		// If there's no digit to convert just return
		if (digits === null) {
			console.log('No digit to convert - returning');
			obj.unitValue = convertedValue;
		} else {
			var digit = eval(digits[1]);
		}
		
	}

	var convertedValue = (digit / 2).toFixed(2);

	var f = new Fraction(convertedValue);
	if (f.numerator > f.denominator) {
		var decimalPortion = convertedValue.match(/\.\d+/)[0];
		var decimalNowAsAFraction = makeFraction(decimalPortion);
		var wholeNumber = convertedValue.match(/\d+/)[0];
		convertedValue = wholeNumber + ' ' + decimalNowAsAFraction;
	} else {
		convertedValue = (f.numerator + '/' + f.denominator);
		cleanFractions((f.numerator + '/' + f.denominator));
	}

	obj.unitValue = convertedValue;

	console.log('Converted ' + $(this).find('input').val() + ' to: ' + convertedValue);
	console.log(obj);


});

function cleanFractions(str) {
	var num = str;
	var isElgibile = false;
	for (var i = 0, allowedFractionsLength = allowedFractions.length; i < allowedFractionsLength; i++) {
		if (num === allowedFractions[i]) {
			isElgibile = true;
			break;
		}
	}
	// If fraction was not found in the allowed fractions array then convert it to the next acceptable fraction
	if (!isElgibile) {
		num = eval(num);
		if (num >= .9) {
			num = '1';
		} else if (num >= .8) {
			num = '4/5';
		} else if (num >= .75) {
			num = '3/4';
		} else if (num >= .6666) {
			num = '2/3';
		} else if (num >= .625) {
			num = '5/8';
		} else if (num >= .5) {
			num = '1/2';
		} else if (num >= .3333) {
			num = '1/3';
		} else if (num >= .25) {
			num = '1/4';
		} else if (num >= .2) {
			num = '1/5'
		} else if (num >= .125) {
			num = '1/8';
		} else if (num >= .1) {
			num = '1/10';
		} else if (num >= .0625) {
			num = '1/16';	
		}
		console.warn(num);
	}
	return num;
}

function getUnitType(str) {
	var userUnit;
	var userUnitArray = str.match(/^[\.\/\d-]+\s*([a-z'""]+)/);
	if (userUnitArray === null) {
		console.log('No user unit array - returning');
		userUnit = null;
	} else {
		userUnit = userUnitArray[1];
	}

	var unitType = null;
	for (var i = 0, unitsLength = units.length; i < unitsLength; i++) {
		for (var j = 0, valuesLength = units[i].values.length; j < valuesLength; j++) {
			if (userUnit === units[i].values[j]) {
				unitType = units[i].type;
			}
		}
	}
	return unitType;
}

function detectWholeWithFraction(str) {
	var matches = str.match(/^\d+[-\s]?\d\/\d/);
	if (matches === null) {
		return false;
	} 
	var wholeNumber = matches[0].match(/\d+/)[0];
	var fraction = matches[0].match(/\d\/\d/)[0];
	var decimal = eval(fraction);
	return +wholeNumber + +decimal;
}

function makeFraction(val) {
	var f = new Fraction(val);
	return (f.numerator + '/' + f.denominator);
}