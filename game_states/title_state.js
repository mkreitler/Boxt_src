/**
 * Displays a single bitmap centered on the screen and
 * waits for the user to touch the screen.
 */

ig.module( 
	'game.game_states.title_state' 
)
.requires(
	'impact.game',
	
	'game.game_states.game_state'
)
.defines(function(){

TitleState = GameState.extend ({
	splashScreen:	null,
	clearColor:		null,
	exitClearColor:	null,
	nextState:		null,
	
	// GameState code goes here.
	init: function(image, clearColor, exitClearColor, nextState) {
		this.splashScreen = image;
		this.clearColor = clearColor;
		this.exitClearColor = exitClearColor;
		this.nextState = nextState;
	},
	
	stateUpdate: function() {
        if (ig.input.pressed('mouseLeft')) {
			_game.playSound(Boxt.SOUNDS.LOW_TONE);
			_game.setNextState(this.nextState);
		}
	},
	
	stateDraw: function() {
		if (this.splashScreen) {
			var x = _gameWidth / 2 - this.splashScreen.width / 2;
			var y = _gameHeight / 2 - this.splashScreen.height / 2;
			
			this.splashScreen.draw(ig.system.getDrawPos(x), ig.system.getDrawPos(y));
		}
	},
	
	stateEnter: function() {
		_game.clearColor = this.clearColor;
	},
	
	stateExit: function() {
		_game.clearColor = this.exitClearColor;
	}
});

});
