/**
 * Class description
 */

ig.module( 
	'game.utility.util_array'
)
.requires(
	'impact.game'
)
.defines(function(){

UtilArray = ig.Class.extend ({
	// We don't instantiate this class, so it needs no properties / methods.
});

UtilArray.removeElement = function(array, element) {
	var arrayOut = array;
	var foundIndex = -1;
	if (array != null) {
		for (var i=0; i<array.length; ++i) {
			if (array[i] === element) {
				foundIndex = i;
				break;
			}
		}
	}

	if (foundIndex === 0) {
		if (array.length === 1) {
			arrayOut = null;			
		}
		else {
			arrayOut = array.slice(1, array.length);
		}
	}
	else if (foundIndex === array.length - 1) {
		// The case of the 1-element array is handled by the previous 'if' clause.
		arrayOut = array.slice(0, array.length - 1);
	}
	else if (foundIndex > 0 && foundIndex < array.length - 1) {
		// If we're here, we're gauranteed at least a 3 element array.
		var before = array.slice(0, foundIndex);
		var after = array.slice(foundIndex + 1, array.length);
		arrayOut = before.concat(after);
	}
	
	if (arrayOut === null) {
		arrayOut = new Array();
	}
	
	return arrayOut;
};

});
