/**
 * Class description
 */

ig.module( 
	'game.graphics.user_font'
)
.requires(
	'impact.game'
)
.defines(function(){

UserFont = ig.Font.extend ({
	init: function(path, widthMap, indices, firstChar) {
		this.parent(path);
		
		this.widthMap = widthMap;
		this.indices  = indices;
		this.firstChar = firstChar;
	},
	
	_loadMetrics: function( image ) {
		// We will be our metrics from an array at creation time.
	}
});

});
