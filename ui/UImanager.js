/**
 * Updates and renders a collection of widgets.
 * Manages the responder chain for UI events.
 */

ig.module( 
	'game.ui.UImanager'
)
.requires(
	'impact.game'
)
.defines(function(){

UImanager = ig.Class.extend ({
	widgetList:		null,
	
	init: function() {
	},
	
	addWidget: function(widget) {
		if (this.widgetList === null) {
			this.widgetList = new Array(widget);
		}
		else {
			this.widgetList.push(widget);
		}
	},
	
	removeWidget: function(widget) {
		this.widgetList = UtilArray.removeElement(this.widgetList, widget);
	},
	
	removeAllWidgets: function() {
		this.widgetList = null;
	},
	
	updateWidgets: function() {
		if (this.widgetList) {
			for (var i=0; i<this.widgetList.length; ++i) {
				var curWidget = this.widgetList[i];
				if (curWidget) {
					curWidget.process();
				}
			}
		}
	},
	
	drawWidgets: function() {
		if (this.widgetList) {
			for (var i=0; i<this.widgetList.length; ++i) {
				var curWidget = this.widgetList[i];
				if (curWidget) {
					curWidget.render(0, 0);
				}
			}
		}
	}
});

});
