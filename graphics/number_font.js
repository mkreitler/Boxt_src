/**
 * Simple bitmap font for displaying digits.
 */



ig.module( 
	'game.graphics.number_font'
)
.requires(
	'impact.game'
)
.defines(function(){

NumberFont = ig.Class.extend ({
	image:	null,
	coords:	null,
	origin: null,
	string: null,
	align:  0,
	
	init: function(fontImage, kerning) {
		image = fontImage;
		coords = kerning;
	},
	
	drawString: function(theString, origin, alignment) {
		
	},
	
	update: function() {
	},
	
	draw: function() {
	}
});

});
