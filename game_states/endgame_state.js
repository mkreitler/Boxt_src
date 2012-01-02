/**
 * Displays a single bitmap centered on the screen and
 * waits for the user to touch the screen.
 */

ig.module( 
	'game.game_states.endgame_state' 
)
.requires(
	'impact.game',
	
	'game.game_states.title_state'
)
.defines(function(){

EndGameState = TitleState.extend ({
	originLeftScore:		{x:0, y:0},
	originRightScore:		{x:0, y:0},
	scores:					{left:0, right:0},
	scoreFont:				null,
	
	// GameState code goes here.
	init: function(image,
				   clearColor,
				   exitClearColor,
				   nextState,
				   scoreFont,
				   scores,
				   originLeftScore,
				   originRightScore) {
		
		this.parent(image, clearColor, exitClearColor, nextState);

		this.scoreFont = scoreFont;
		this.scores = scores;		
		this.originLeftScore = originLeftScore;
		this.originRightScore = originRightScore;
	},
	
	stateDraw: function() {
		// Draw the background.
		this.parent();
		
		if (this.scoreFont && this.scores) {
			// Draw the scores.
			var x = this.originLeftScore.x;
			var y = this.originLeftScore.y - this.scoreFont.height / 2;
			
			this.scoreFont.draw(this.scores.left, ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);
			
			x = this.originRightScore.x;
			y = this.originRightScore.y - this.scoreFont.height / 2;
			
			this.scoreFont.draw(this.scores.right, ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);
		}
	}
});

});
