/**
 * Generic UI element. Maintains a bounding box used to respond to
 * UI events. Also maintains a list of children whose coordinates
 * are local to the parent.
 *
 * Initially, there will be no explicit Z-order. Widgets will render
 * in the order they were added to the scene.
 */

ig.module( 
	'game.ui.widget'
)
.requires(
	'impact.game'
)
.defines(function(){

Widget = ig.Class.extend ({
	origin:		{x:0, y:0},
	size:		{width:0, height:0},
	children:	null,
	
	init: function() {
	},
	
	moveTo: function(newX, newY) {
		this.origin.x = newX;
		this.origin.y = newY;
	},
	
	addChild: function(child) {
		if (this.children === null) {
			this.children = new Array(child);
		}
		else {
			this.children.push(child);
		}
	},
	
	removeChild: function(child) {
		this.children = _game.utilArray.removeElement(this.children, child);
	},
	
	removeAllChildren: function() {
		this.children = null;
	},

	drawElement: function(worldX, worldY) {
		// Override this in child classes to provide custom rendering behavior.		
	},
	
	drawChildren: function(worldX, worldY) {
		if (this.children != null) {
			for (var i=0; i<this.children.length; ++i) {
				this.children[i].render(worldX, worldY);
			}
		}
	},

	updateSelf: function() {
	},
	
	updateChildren: function() {
		if (this.children != null) {
			for (var i=0; i<this.children.length; ++i) {
				this.children[i].process(worldX, worldY);
			}
		}
	},
	
	process: function() {
		this.updateSelf();
		
		this.updateChildren();
	},
	
	render: function(worldX, worldY) {
		// Draw this element.
		this.drawElement(worldX, worldY);
		
		// Draw all children.
		this.drawChildren(worldX + this.origin.x, worldY + this.origin.y);
	}
});

});
