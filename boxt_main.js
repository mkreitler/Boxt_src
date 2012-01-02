// Project Globals /////////////////////////////////////////////////////////////
_game = 			null;
_gameWidth =		1004,
_gameHeight =		640,
_epsilon =			0.0001,

// Main Game Module ////////////////////////////////////////////////////////////
ig.module( 
	'game.boxt_main' 
)
.requires(
	'impact.gfx_extensions',
	'impact.game',
	'impact.font',
	'impact.timer',
	
	'game.box_manager',
	'game.box',
	'game.game_states.title_state',
	'game.game_states.playing_state',
	'game.game_states.game_select_state',
	'game.graphics.user_font',
	'game.ui.UImanager',
	'game.particles.particle_base'
)
.defines(function(){

////////////////////////////////////////////////////////////////////////////////

Boxt = ig.Game.extend({
	
	_cellWidth:			32,
	_cellHeight:		32,
	_uiManager:			new UImanager(),
	_timer:				new ig.Timer(),
	_dt:				0.0,
	_mode:				0,		// FOR NOW: default to "single player" mode.
	
    // Load image files
    playerOneImages: new Array(new ig.Image('media/boxt/images/back14.png'),
							   new ig.Image('media/boxt/images/back11.png'),
                               new ig.Image('media/boxt/images/back12.png'),
                               new ig.Image('media/boxt/images/back13.png'),
							   new ig.Image('media/boxt/images/border01.png')),
    
    playerTwoImages: new Array(new ig.Image('media/boxt/images/back24.png'),
							   new ig.Image('media/boxt/images/back21.png'),
                               new ig.Image('media/boxt/images/back22.png'),
                               new ig.Image('media/boxt/images/back23.png'),
                               new ig.Image('media/boxt/images/border02.png')),
	
	neutralImage:	 new ig.Image('media/boxt/images/selector.png'),
	blockedImage:	 new ig.Image('media/boxt/images/selector_blocked.png'),
	
	playerInfoImage: new Array(new ig.Image('media/boxt/images/player_info01.png'),
							   new ig.Image('media/boxt/images/player_info02.png')),
	
	labelImages:	 new Array(new ig.Image('media/boxt/images/info_lock.png'),
							   new ig.Image('media/boxt/images/info_drag.png'),
							   new ig.Image('media/boxt/images/info_thinking.png'),
							   new ig.Image('media/boxt/images/info_hold.png')),
	
	splashScreens:	 new Array(new ig.Image('media/boxt/images/titlescreen.png'),
							   new ig.Image('media/boxt/images/game_select.png'),
							   new ig.Image('media/boxt/images/difficulty_select.png'),
							   new ig.Image('media/boxt/images/rules.png'),
							   new ig.Image('media/boxt/images/end_green_wins.png'),
							   new ig.Image('media/boxt/images/end_purple_wins.png'),
							   new ig.Image('media/boxt/images/end_tie_game.png')),
	
	// Load animation sheets
	sheetStars:		 new Array(new ig.AnimationSheet('media/boxt/images/particles_star_p1.png', 40, 40),
							   new ig.AnimationSheet('media/boxt/images/particles_star_p2.png', 40, 40)),
	
	sheetSwirls:	 new Array(new ig.AnimationSheet('media/boxt/images/particles_swirl_p1.png', 40, 40),
							   new ig.AnimationSheet('media/boxt/images/particles_swirl_p2.png', 40, 40)),
	
	animSheets:		 new Array(null, null),
	
	// Load fonts
	systemFont:		 new ig.Font('media/04b03.font.png'),
	
	font:			 new UserFont('media/boxt/images/font_clean.png',
								  [16, 13, 16, 17, 17, 17,  17,  16,  16,  16],
								  [ 0, 18, 36, 54, 72, 89, 108, 126, 144, 162],
								  48),
	numberFont:		 new UserFont('media/boxt/images/fat_font.png',
								  [40, 22,  31,  33,  32,  32,  34,  30,  39, 37],
								  [ 9, 64, 105, 154, 202, 250, 298, 350, 393, 448],
								  48),
	
	// Load sounds
	sounds:			 new Array(new ig.Sound('media/boxt/sounds/low_synth.ogg'),
							   new ig.Sound('media/boxt/sounds/mid_synth.ogg'),
							   new ig.Sound('media/boxt/sounds/high_synth.ogg'),
							   new ig.Sound('media/boxt/sounds/perfect_synth.ogg'),
							   new ig.Sound('media/boxt/sounds/no_score_synth.ogg'),
							   new ig.Sound('media/boxt/sounds/click_synth.ogg')),
	
	
	currentState:	null,
	nextState:		null,

    init: function() {
		_game = this;
		
		// Init input bindings.
	     ig.input.bind( ig.KEY.MOUSE1, 'mouseLeft' );

		 this.currentState = null;
		 this.nextState = this.newTitleScreen();
		 
		 // Fix up anim sheet references.
		 this.animSheets[0] = this.sheetStars;
		 this.animSheets[1] = this.sheetSwirls;
		 
		 // Listen for diagnostics toggle.
		ig.input.bind( ig.KEY.D, 'diagnostics_toggle' );
	},
	
	setMode: function(newMode) {
		if (newMode >= 0 && newMode < Boxt.MODE.NUM_MODES) {
			this._mode = newMode;
		}
	},
	
	setMode: function(newMode) {
		this._mode = newMode;
	},
	
	getMode: function() {
		return this._mode;
	},		
	
	getSplashScreen: function(index) {
		screen = null;
		
		if (index >= 0 && index < this.splashScreens.length) {
			screen = this.splashScreens[index];
		}
		
		return screen;
	},
	
	newTitleScreen: function() {
		 return new TitleState(this.splashScreens[Boxt.SPLASHSCREENS.TITLE],
							   "#80e5ff",
							   "#80e5ff",
							   new GameSelectState(this.splashScreens[Boxt.SPLASHSCREENS.PICK_GAME], '#80e5ff', '#000000'));
	},
	
	getGameRows: function() {
		return _gameHeight / this._cellHeight;		
	},
	
	getGameColumns: function() {
		return (_gameWidth - 2 * this.getLevelOffsetX()) / this._cellWidth;
	},
	
	getAnimSheet: function(sheetType, playerIndex) {
		sheet = null;
		
		if (sheetType >= 0 && sheetType < this.animSheets.length) {
			var sheetSet = this.animSheets[sheetType];
			if (sheetSet && playerIndex >= 0 && playerIndex < sheetSet.length) {
				sheet = sheetSet[playerIndex];
			}
		}
		
		return sheet;
	},
	
	getLabelImage: function(index) {
		image = null;
		
		if (index >= 0 && index < this.labelImages.length) {
			image = this.labelImages[index];
		}
		
		return image;
	},
	
	getLevelOffsetX: function() {
		return this.playerInfoImage[0] ? this.playerInfoImage[0].width : 0;
	},
	
	getLevelOffsetY: function() {
		return 0;
	},
	
	getPlayerInfoWidth: function() {
		var width = 0;
		
		if (this.playerInfo != null && this.playerInfo[0] != null) {
			width = this.playerInfo[0].width;
		}
		
		return width;
	},
	
	setNextState: function(newState) {
		this.nextState = newState;
	},
	
	update: function() {
		this.parent();
		
		// Update the frame interval before we update anything else.
		this._dt = this._timer.tick();
		
		if (this.currentState != null) {
			this.currentState.stateUpdate();
		}
		
		if (this.nextState != null && this.nextState != this.currentState) {
			// Clean up current state.
			if (this.currentState != null) {
				this.currentState.stateExit();
				_game.removeEntity(this.currentState);
			}
			
			// Initialize the new state.
			this.nextState.stateEnter();
			
			// Transition into the new state.
			this.currentState = this.nextState;
			
			// New state is no longer new.
			this.nextState = null;
		}
		
		if (this._uiManager.updateWidgets() != null) {
			_uiManager.updateWidgets();
		}
		
		if( ig.input.pressed('diagnostics_toggle') ) {
			Boxt._diagnosticsOn = !Boxt._diagnosticsOn;
		}
	},
	
	playSound: function(soundID) {
		if (this.sounds != null &&
			soundID >= 0 && soundID < this.sounds.length) {
			this.sounds[soundID].play();
		}
	},
	
    // Drawing Methods ////////////////////////////////////////////////////////
	draw: function() {
		this.parent();

		if (this.currentState != null) {
			this.currentState.stateDraw();
		}
		
		BaseParticle.drawDeferred();
		
		if (this._uiManager != null) {
			this._uiManager.drawWidgets();
		}
		
		if (Boxt._diagnosticsOn && this.systemFont && this._dt > 0) {
			// Display the frame rate in the lower right corner.
			var x = _gameWidth - 20;
			var y = _gameHeight - 20;
			
			var fps = parseInt(1 / this._dt + 0.5);
			this.systemFont.draw('FPS:' + fps, ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER)
		}
	}
});

Boxt.IMAGES = {
	UNSCORED:		0,
	SCORE_OK:		1,
	SCORE_GOOD:		2,
	SCORE_PERFECT:	3,
	BORDER:			4,
	
	// Insert new entries above this line and update
	// NUM_IMAGES' value accordingly.
	NUM_IMAGES:		5
};

Boxt.SOUNDS = {
	LOW_TONE:		0,
	MID_TONE:		1,
	HIGH_TONE:		2,
	PERFECT_TONE:	3,
	NO_SCORE:		4,
	CLICK:			5,
	
	// Insert new entries above this line and update
	// NUM_SOUNDS' value accordingly.
	NUM_SOUNDS:		6
};

Boxt.LABELS = {
	LOCK:		0,
	DRAG:		1,
	THINKING:	2,
	HOLD:		3,
	
	// Insert new entries above this line and update
	// NUM_LABELS' value accordingly.
	NUM_LABELS:		4
};

Boxt.ANIMSHEETS = {
	STARS:		0,
	SWIRLS:		1,
	
	// Insert new entries above this line and update
	// NUM_ANIMSHEETS' value accordingly.
	NUM_ANIMSHEETS:	2
},

Boxt.SPLASHSCREENS = {
	TITLE:		0,
	PICK_GAME:	1,
	DIFFICULTY: 2,
	RULES:		3,
	END_GREEN:	4,
	END_PURPLE:	5,
	END_TIE:	6,
	
	NUM_ANIMSHEETS: 7
},

Boxt.MODE = {
	SINGLE_PLAYER:		0,
	LOCAL_MULTIPLAYER:	1,
	
	NUM_MODES:			2
},

Boxt._diagnosticsOn = false;

// Disable all sounds for mobile devices
ig.Sound.enabled = ig.ua.mobile ? false : true;

// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2
ig.main( '#canvas', Boxt, 60, _gameWidth, _gameHeight, 1 );

});
