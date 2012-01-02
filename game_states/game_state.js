/**
 * Class description
 */

ig.module( 
	'game.game_states.game_state'
)
.requires(
	'impact.game'
)
.defines(function(){

GameState = ig.Class.extend ({
	nextGoalOffset:	[91, 422],
	goalOffset:		[91, 305],
	scoreOffset:	[91, 65],
	messageOffset:	[0, 118],

	_originScoreLeft:	{x:537, y:136},
	_originScoreRight:	{x:719, y:136},
	
	init: function() {
	},
	
	clampMouseX: function(mouseX) {
		mouseX = mouseX - _game.getLevelOffsetX();
		mouseX = Math.max(0, mouseX);
		mouseX = Math.min(mouseX, _gameWidth - 2 * _game.getLevelOffsetX() - 1);
		
		return mouseX;
	},
	
	update: function() {
	},
	
	draw: function() {
	},
	
	gameOver: function() {
		var outOfMoves = this.players[0].getGoal() < 0 &&
						 this.players[1].getGoal() < 0;
						 
		var outOfSpace = false;
		if (!outOfMoves && this.boxManager) {
			var availableArea = _game.getGameRows() * _game.getGameColumns();
								
								
			if (availableArea <= this.boxManager.getAreaUsed()) {
				outOfSpace = true;
			}
		}

		return outOfMoves || outOfSpace;
	},
});

});
