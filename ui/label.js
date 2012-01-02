/**
 * Class description
 */

ig.module( 
	'game.ui.label'
)
.requires(
	'impact.game',
	
	'game.ui.widget'
)
.defines(function(){

Label = Widget.extend ({
	labelImage:		null,
	origin:			{x:0, y:0},
	
	init: function(image, x, y) {
		this.labelImage = image;
		this.origin.x = x;
		this.origin.y = y;
	},
	
	changeImage: function(newImage) {
		this.labelImage = newImage;
	},
	
	drawElement: function(worldX, worldY) {
		if (this.labelImage != null) {
			// Override this in child classes to provide custom rendering behavior.
			var x = this.origin.x + worldX;
			var y = this.origin.y + worldY;
			var drawX = ig.system.getDrawPos(x);
			var drawY = ig.system.getDrawPos(y);
			
			this.labelImage.draw(x, y);
		}
	}
});

});
