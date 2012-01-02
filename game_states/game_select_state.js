/**
 * Displays a single bitmap centered on the screen and
 * waits for the user to touch the screen.
 */

ig.module( 
	'game.game_states.game_select_state' 
)
.requires(
	'impact.game',
	
	'game.game_states.playing_state',
	'game.game_states.difficulty_select_state',
	'game.game_states.title_state'
)
.defines(function(){

GameSelectState = TitleState.extend ({
	boundsVertical:		{yTop:194, yBottom:436},
	boundsHorizontal:	new Array({xLeft:225, xRight: 375, fn:null},
								  {xLeft:425, xRight: 575, fn:null},
								  {xLeft:625, xRight: 775, fn:null}),

	init: function(image, clearColor, exitClearColor) {
		this.parent(image, clearColor, exitClearColor, null);
		
		// Fix up function pointers.
		this.boundsHorizontal[0].fn = this.selectSinglePlayerDifficulty;
		this.boundsHorizontal[1].fn = this.startMultiPlayerGame;
		this.boundsHorizontal[2].fn = this.showRules;
	},
	
	selectSinglePlayerDifficulty: function() {
		_game.setMode(Boxt.MODE.SINGLE_PLAYER);
		 _game.setNextState(new DifficultySelectState(_game.getSplashScreen(Boxt.SPLASHSCREENS.DIFFICULTY),
										   "#80e5ff",
										   "#000000",
										   null));
	},
	
	startMultiPlayerGame: function() {
		_game.setMode(Boxt.MODE.LOCAL_MULTIPLAYER);
		_game.setNextState(new PlayingState());
	},
	
	showRules: function() {
		var nextState = new GameSelectState(_game.getSplashScreen(Boxt.SPLASHSCREENS.PICK_GAME), '#80e5ff', '#80e5ff');
		 _game.setNextState(new TitleState(_game.getSplashScreen(Boxt.SPLASHSCREENS.RULES),
										   "#80e5ff",
										   "#80e5ff",
										   nextState));
	},
	
	stateUpdate: function() {
        if (ig.input.pressed('mouseLeft')) {
			var mouseX = ig.input.mouse.x;
			var mouseY = ig.input.mouse.y;
			
			if (mouseY >= this.boundsVertical.yTop && mouseY <= this.boundsVertical.yBottom) {
				for (var i=0; i<this.boundsHorizontal.length; ++i) {
					if (mouseX >= this.boundsHorizontal[i].xLeft &&
						mouseX <= this.boundsHorizontal[i].xRight &&
						this.boundsHorizontal[i].fn) {
						this.boundsHorizontal[i].fn();
						break;
					}
				}
			}
			_game.playSound(Boxt.SOUNDS.LOW_TONE);
		}
	}
});

});
