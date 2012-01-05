/**
 * Game state containing code used to test systems in development.
 */

ig.module( 
	'game.game_states.playing_state' 
)
.requires(
	'impact.game',
	'impact.font',
	
	'game.game_states.game_state',
	'game.game_states.endgame_state',
	'game.players.player_base',
	'game.graphics.user_font',
	'game.ui.label',
	'game.players.player_local_multiplayer',
	'game.players.player_ai'
)
.defines(function(){

PlayingState = GameState.extend ({
	// Instance Variables //////////////////////////////////////////////////////
	mouseStart: 	{x: 0, y: 0},
    mouseNow:   	{x: 0, y: 0},
    cellStart:  	{col: 0, row: 0},
    cellEnd:    	{col: 0, row: 0},
    mouseDown:  	false,
	selectBox:		null,
	boxManager:		null,
	playerIndex:	0,
	players:		null,
	newBox:			null,
	selDeltaLast:	{x:0, y:0},
	infoLabel:		null,
	boxID:			0,
	thinkTimer:		0,
	clickWait:		0,
	holdTimer:		0,
	
	debugIndex:		0,
	debugBase:		0,
	
	_goalLookahead:			5,
	_goalVertOffsetFactor:	2.7,
	_pi:					3.14159265359,
	_thinkFreq:				0.3,
	_thinkAmp:				37.5,
	_clickWaitSec:			0.1,
	_holdDuration:			0.5,
	
	// Methods /////////////////////////////////////////////////////////////////
	// GameState code goes here.
	init: function() {
		this.stateUpdate = this.updateWaitingForMouseDown;
		
		var x = this.messageOffset[0];
		var y = this.messageOffset[1];
		
		this.infoLabel = new Label(_game.getLabelImage(Boxt.LABELS.DRAG), x, y);
	},
	
	startAIturn: function() {
		var player = this.players[this.playerIndex];
		
		this.thinkTimer = 0;
		
		this.infoLabel.changeImage(_game.getLabelImage(Boxt.LABELS.THINKING));
		
		if (player && this.selectBox && this.boxManager) {
			player.startTurn(this.selectBox, this.boxManager, this.boxID);
			this.stateUpdate = this.AIthinkUpdate;
		}
		else {
			// Skip the AI turn...but this should never happen.
			this.stateUpdate = this.nextTurn();
		}
	},
	
	AIthinkUpdate: function() {
		var player = this.players[this.playerIndex];
		
		// Animate the "thinking" label's position.
		var sinArg = 2 * this._pi * this._thinkFreq * this.thinkTimer;
		var x = this.messageOffset[0] + _gameWidth - _game.getLevelOffsetX();
		var y = this.messageOffset[1] + this._thinkAmp * Math.sin(sinArg); 
		
		this.infoLabel.moveTo(x, y);
		
		this.thinkTimer += _game._dt;
		
		if (player) {
			this.newBox = player.think();
		}
		
		if (this.newBox) {
			this.boxManager.addBox(this.newBox);
			this.stateUpdate = this.acceptBox(player);
		}
	},
	
	nextTurn: function() {
		var player = this.players[this.playerIndex];
		var nextUpdate = this.updateWaitingForMouseDown;

		// Advance the current player to its next turn.		
		player.nextTurn();
		
		if (player === this.players[0]) {
			++this.debugBase;
		}

		// Flip players.
		this.playerIndex = (++this.playerIndex) % 2;
		
		if (this.playerIndex === PlayingState._AIplayerIndex &&
			_game.getMode() === Boxt.MODE.SINGLE_PLAYER) {
			nextUpdate = this.startAIturn;
		}
		
		// Check for "game over".
		if (!this.gameOver()) {
			// Move the instruction labels to the other side of the screen
			// and reset the image.
			var x = this.messageOffset[0];
			var y = this.messageOffset[1];
			
			if (this.playerIndex === 1) {
				x = this.messageOffset[0] + _gameWidth - _game.getLevelOffsetX();
			}
			
			this.infoLabel.moveTo(x, y);
			this.infoLabel.changeImage(_game.getLabelImage(Boxt.LABELS.DRAG));
		}
		else {
			nextUpdate = this.endGame;
		}
		
		return nextUpdate;
	},
	
	endGame: function() {
		var nextState = null;
		
		
		if (this.players[0].getScore() > this.players[1].getScore()) {
			var offsetX = (_gameWidth - _game.getSplashScreen(Boxt.SPLASHSCREENS.END_GREEN).width) / 2;
			var offsetY = (_gameHeight - _game.getSplashScreen(Boxt.SPLASHSCREENS.END_GREEN).height) / 2
			
			var originLeft = {x:this._originScoreLeft.x + offsetX, y:this._originScoreLeft.y + offsetY};
			var originRight = {x:this._originScoreRight.x + offsetX, y:this._originScoreRight.y + offsetY};
			
			nextState = new EndGameState(_game.getSplashScreen(Boxt.SPLASHSCREENS.END_GREEN),
							   "#54c600",
							   "#000000",
							   _game.newTitleScreen(),
							   _game.numberFont,
							   {left:this.players[0].getScore(), right:this.players[1].getScore()},
							   originLeft,
							   originRight);
		}
		else if (this.players[1].getScore() > this.players[0].getScore()) {
			var offsetX = (_gameWidth - _game.getSplashScreen(Boxt.SPLASHSCREENS.END_PURPLE).width) / 2;
			var offsetY = (_gameHeight - _game.getSplashScreen(Boxt.SPLASHSCREENS.END_PURPLE).height) / 2
			
			var originLeft = {x:this._originScoreLeft.x + offsetX, y:this._originScoreLeft.y + offsetY};
			var originRight = {x:this._originScoreRight.x + offsetX, y:this._originScoreRight.y + offsetY};
			
			nextState = new EndGameState(_game.getSplashScreen(Boxt.SPLASHSCREENS.END_PURPLE),
							   "#7400c5",
							   "#000000",
							   _game.newTitleScreen(),
							   _game.numberFont,
							   {left:this.players[1].getScore(), right:this.players[0].getScore()},
							   originLeft,
							   originRight);
		}
		else {
			nextState = new TitleState(_game.getSplashScreen(Boxt.SPLASHSCREENS.END_TIE),
							   "#80e5ff",
							   "#000000",
							   _game.newTitleScreen());
		}
		
		_game.setNextState(nextState);
	},
	
	update: function() {
		// Impact's update() does nothing. This allows us
		// to instantiate this class without it auto-updating.
	},
	
	updateWaitingForMouseDown: function() {
        if (ig.input.pressed('mouseLeft')) {
            // set the starting point
            this.mouseStart.x = this.clampMouseX(ig.input.mouse.x);
            this.mouseStart.y = ig.input.mouse.y;

            this.cellStart.col = parseInt(this.mouseStart.x / _game._cellWidth);
            this.cellStart.row = parseInt(this.mouseStart.y / _game._cellHeight);
            this.mouseDown = true;
			
			_game.playSound(Boxt.SOUNDS.LOW_TONE);
			
			// Reset 'last selection delta' tracker so we're not using
			// data from the last box drawn.
			this.selDeltaLast.row = -1;
			this.selDeltaLast.col = -1;
			
			// Call updateMouseDrag immediately to fully initialize the selection
			// area.
			this.updateMouseDrag();
			
			this.stateUpdate = this.updateMouseDrag;
	    }
	},
	
	updateMouseDrag: function() {
	    if (ig.input.state('mouseLeft')) {
            this.mouseNow.x = this.clampMouseX(ig.input.mouse.x);
            this.mouseNow.y = ig.input.mouse.y;
            
            this.cellEnd.col = parseInt(this.mouseNow.x / _game._cellWidth);
            this.cellEnd.row = parseInt(this.mouseNow.y / _game._cellHeight);
			
			// Update the selection box.			
			var selStartRow = Math.min(this.cellStart.row, this.cellEnd.row);
			var selStartCol = Math.min(this.cellStart.col, this.cellEnd.col);
			var selDeltaRow = Math.abs(this.cellStart.row - this.cellEnd.row) + 1;
			var selDeltaCol = Math.abs(this.cellStart.col - this.cellEnd.col) + 1;
			
			// Keep the selection box in bounds.
			selStartRow = this.boundRow(selStartRow);
			selStartCol = this.boundCol(selStartCol);
			selDeltaRow = this.boundHeight(selStartRow, selDeltaRow);
			selDeltaCol = this.boundWidth(selStartCol, selDeltaCol);
			
			this.selectBox.setPositionInfo(selStartRow, selStartCol, selDeltaCol, selDeltaRow);
			this.selectBox.setInvalid(this.boxManager.testOverlap(this.selectBox));
			
			if (this.selDeltaLast.row != -1 && this.selDeltaLast.col != -1) {
				if (this.selDeltaLast.row != selDeltaRow || this.selDeltaLast.col != selDeltaCol) {
					if (this.clickWait <= 0) {
						_game.playSound(Boxt.SOUNDS.CLICK);
						this.clickWait = this._clickWaitSec;
					}
				}
			}
			
			this.selDeltaLast.row = selDeltaRow;
			this.selDeltaLast.col = selDeltaCol;
	    }
		else {
			this.mouseReleased();
		}
	},
	
	acceptBox: function(player) {
		var oldScore = player.getScore();
		var backgroundIndex = this.boxManager.scoreBox(this.newBox.origin.row,
													   this.newBox.origin.col,
													   this.newBox.size.width,
													   this.newBox.size.height,
													   player.getGoal(),
													   player,
													   this.playerIndex);
		
		// Change the box's background to reflect its value.
		this.newBox.setTileSet(player.tileSetForIndex(backgroundIndex));
		
		// Use the backgroundIndex to back-solve for this box's value.
		// Yes, this is ugly, but I don't want to add another variable
		// or an extra function to work around it.
		if (backgroundIndex === Boxt.IMAGES.SCORE_PERFECT) {
			this.newBox.setValue(BoxManager.SCORE.PERFECT)
			this.newBox.emit(this.playerIndex);
		}
		else if (backgroundIndex === Boxt.IMAGES.SCORE_GOOD) {
			this.newBox.setValue(BoxManager.SCORE.GOOD);
			this.newBox.emit(this.playerIndex);
		}
		else {
			this.newBox.setValue(BoxManager.SCORE.OK)
		}
		
		// Play a sound based on the number of points scored.
		var deltaScore = player.getScore() - oldScore;
		if (deltaScore === 0) {
			_game.playSound(Boxt.SOUNDS.NO_SCORE);
		}
		else if (deltaScore < 3) {
			_game.playSound(Boxt.SOUNDS.HIGH_TONE);
		}
		else {
			_game.playSound(Boxt.SOUNDS.PERFECT_TONE);
		}
		
		return this.nextTurn();
	},
	
	updateWaitForPlayerAccept: function() {
        if (ig.input.pressed('mouseLeft')) {
			// Is the mouse event within the new box?
			var mouseX = this.clampMouseX(ig.input.mouse.x);
			var mouseY = ig.input.mouse.y;
			var player = this.players[this.playerIndex];
			var nextUpdate = this.updateWaitingForMouseDown;
			
			if (player && this.newBox != null && this.newBox.containsPoint(mouseX, mouseY)) {
				// Mobile users must hold on the box for 1 second to accept it.
				// This prevents errant touch events from locking in bad boxes.
				if (ig.ua.mobile) {
					this.holdTimer = this._holdDuration;
					nextUpdate = this.updateWaitForPlayerAccept;
				}
				else {
					nextUpdate = this.acceptBox(player);
					this.newBox = null;		
				}
			}
			else {
				// Reset.
				this.boxManager.removeBox(this.newBox);
				this.newBox = null;		
			}
			
			this.stateUpdate = nextUpdate;
		}
		else if (ig.input.state('mouseLeft') && ig.ua.mobile) {
			this.holdTimer -= _game._dt;
			if (this.holdTimer <= 0) {
				var player = this.players[this.playerIndex];
			
				if (player && this.newBox != null) {
					nextUpdate = this.acceptBox(player);
					this.stateUpdate = nextUpdate;
					this.newBox = null;		
				}
			}
		}
		else if (ig.ua.mobile && this.holdTimer > 0) {
			this.holdTimer = 0;
		}
	},
	
	mouseReleased: function() {
		if (this.infoLabel && this.mouseDown && !this.selectBox.isBlocked() && !this.selectBox.isTooBig()) {
			var player = this.players[this.playerIndex];
			var row = this.selectBox.origin.row;
			var col = this.selectBox.origin.col;
			var width = this.selectBox.size.width;
			var height = this.selectBox.size.height;
			
			this.newBox = null;
			if (player != null) {
				// Create a new box identifier.
				this.boxID = Math.abs(this.boxID);
				this.boxID += 1;
				if (this.playerIndex === 1) {
					this.boxID *= -1;
				}
				
				this.newBox = new Box(this.boxID,
									  row,
									  col,
									  width,
									  height,
									  player.getBackTileSet(Boxt.IMAGES.UNSCORED),
									  player.getEdgeTileSet(),
									  null,
									  _game._cellWidth,
									  0,
									  player,
									  _game.getLevelOffsetX() + col * _game._cellWidth,
									  row * _game._cellHeight);
				
				this.boxManager.addBox(this.newBox);
				
				this.stateUpdate = this.updateWaitForPlayerAccept;
				if (ig.ua.mobile) {
					this.infoLabel.changeImage(_game.getLabelImage(Boxt.LABELS.HOLD));
				}
				else {
					this.infoLabel.changeImage(_game.getLabelImage(Boxt.LABELS.LOCK));
				}
			}
			else {
				this.stateUpdate = this.updateWaitingForMouseDown;
			}
		}
		else {
			this.stateUpdate = this.updateWaitingForMouseDown;
		}
		
		_game.playSound(Boxt.SOUNDS.MID_TONE);
		
		this.mouseDown = false;
	},

	stateUpdate: function() {
		// Empty function. We will swap other functions into the stateUpdate
		// depending on the "state within the game state".
	},
	
	boundRow: function(row) {
		if (row < 0) row = 0;
		
		return row;
	},
	
	boundCol: function(col) {
		if (col < 0) col = 0;
		
		return col;
	},
	
	boundHeight: function(row, height) {
		var maxRows = parseInt(_gameHeight / _game._cellHeight);
		
		if (row + height > maxRows) height = maxRows - row;
		
		return height;
	},
	
	boundWidth: function(col, width) {
		var maxCols = parseInt(_gameWidth - 2 * _game.getPlayerInfoWidth()) / _game._cellWidth;
		
		if (col + width > maxCols) width = maxCols - col;
		
		return width;
	},
	
	draw: function() {
		// Impact draw() does nothing. This allows us
		// to instantiate this class with it auto-drawing.
	},
	
	drawBoxes: function() {
		this.boxManager.draw();
	},
	
	drawGhostGems: function() {
		this.selectBox.draw();
	},
	
	drawSelectionInfo: function() {
		// Compute the coordinates of the outline box.
		var startRow = Math.min(this.cellStart.row, this.cellEnd.row);
		var endRow   = Math.max(this.cellStart.row, this.cellEnd.row);
		var startCol = Math.min(this.cellStart.col, this.cellEnd.col);
		var endCol   = Math.max(this.cellStart.col, this.cellEnd.col);

		var height = endRow - startRow + 1;
		var width = endCol - startCol + 1;
		
		startRow = this.boundRow(startRow);
		startCol = this.boundCol(startCol);
		height = this.boundHeight(startRow, height);
		width = this.boundWidth(startCol, width);
		endRow = startRow + height - 1;
		endCol = startCol + width - 1;
		
		var x0 = startCol * _game._cellWidth + _game.getLevelOffsetX();
		var y0 = startRow * _game._cellHeight + _game.getLevelOffsetY();
		var x1 = (startCol + width) * _game._cellWidth + _game.getLevelOffsetX() - 1;
		var y1 = startRow * _game._cellHeight + _game.getLevelOffsetY();
		var x2 = (startCol + width) * _game._cellWidth + _game.getLevelOffsetX() - 1;
		var y2 = (startRow + height) * _game._cellHeight + _game.getLevelOffsetY() - 1;
		var x3 = startCol * _game._cellWidth + _game.getLevelOffsetX();
		var y3 = (startRow + height) * _game._cellHeight + _game.getLevelOffsetY() - 1;
		
		// Convert to canvas coordinates.
		x0 = ig.system.getDrawPos(x0 + ig.game.screen.x);
		y0 = ig.system.getDrawPos(y0 + ig.game.screen.y);
		x1 = ig.system.getDrawPos(x1 + ig.game.screen.x);
		y1 = ig.system.getDrawPos(y1 + ig.game.screen.y);
		x2 = ig.system.getDrawPos(x2 + ig.game.screen.x);
		y2 = ig.system.getDrawPos(y2 + ig.game.screen.y);
		x3 = ig.system.getDrawPos(x3 + ig.game.screen.x);
		y3 = ig.system.getDrawPos(y3 + ig.game.screen.y);
		
		if (this.stateUpdate != this.updateWaitForPlayerAccept) {
			var dashGapArray = [8, 5];
			ig.system.context.lineWidth = 1.5;
			
			ig.system.context.strokeStyle = 'rgb(255,0,0)';
			ig.system.context.beginPath();
			ig.system.context.dashedLine(x0, y0, x1, y1, dashGapArray, 0);
			ig.system.context.dashedLine(x1, y1, x2, y2, dashGapArray, 0);
			ig.system.context.dashedLine(x2, y2, x3, y3, dashGapArray, 0);
			ig.system.context.dashedLine(x3, y3, x0, y0, dashGapArray, 0);
			ig.system.context.closePath();
			ig.system.context.stroke();
		}
		
		// Draw the side length numbers, making sure they
		// are always outside the shape.
		var yMin = Math.min(y0, y2);
		var yMax = Math.max(y0, y2);
		var xMin = Math.min(x0, x1);
		var xMax = Math.max(x0, x1);
		
		var fontX = (x0 + x1) / 2;
		var fontY = yMin - _game._cellHeight / 2 - _game.font.height;
        _game.font.draw( Math.abs(startCol - endCol) + 1, fontX, fontY, ig.Font.ALIGN.CENTER );
		
		var fontX = xMax + _game._cellWidth / 2;
		var fontY = (y1 + y2) / 2;
        _game.font.draw( Math.abs(startRow - endRow) + 1, fontX, fontY, ig.Font.ALIGN.CENTER );
		
		var fontX = (x2 + x3) / 2;
		var fontY = yMax + _game._cellHeight / 2;
        _game.font.draw( Math.abs(startCol - endCol) + 1, fontX, fontY, ig.Font.ALIGN.CENTER );
		
		var fontX = xMin - _game._cellWidth / 2;
		var fontY = (y3 + y0) / 2;
        _game.font.draw( Math.abs(startRow - endRow) + 1, fontX, fontY, ig.Font.ALIGN.CENTER );
	},
	
	drawScores: function() {
		var x = this.scoreOffset[0];
		var y = this.scoreOffset[1];
		
		_game.numberFont.draw(this.players[0].totalScore, ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);

		x = _gameWidth - _game.getLevelOffsetX() + this.scoreOffset[0];

		_game.numberFont.draw(this.players[1].totalScore, ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);
	},
	
	drawGoal: function(goals, x, y) {
		
		if (this.debugIndex < this.players[0].pieceOrder.length && goals[0] != this.players[0].pieceOrder[this.debugIndex]) {
			_game.numberFont.draw(goals[0], ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);
		}
		
		if (goals[0] >= 0) {
			_game.numberFont.draw(goals[0], ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);
		}

		x = _gameWidth - _game.getLevelOffsetX() + this.goalOffset[0];

		if (goals[1] >= 0) {
			_game.numberFont.draw(goals[1], ig.system.getDrawPos(x), ig.system.getDrawPos(y), ig.Font.ALIGN.CENTER);
		}
	},
	
	drawGoals: function() {
		var x = this.goalOffset[0];
		var y = this.goalOffset[1];
		var goals = [this.players[0].getGoal(), this.players[1].getGoal()];

		this.debugIndex = this.debugBase;

		this.drawGoal(goals, x, y);

		y += this.nextGoalOffset[1] - this.goalOffset[1];
		for (var i=0; i<this._goalLookahead; ++i) {
			++this.debugIndex;
			x = this.nextGoalOffset[0];
			goals = [this.players[0].getOffsetGoal(i + 1), this.players[1].getOffsetGoal(i + 1)];
			this.drawGoal(goals, x, y);
			
			y += (this.nextGoalOffset[1] - this.goalOffset[1]) / this._goalVertOffsetFactor;
		}
	},
	
	stateDraw: function() {
		// Draw the existing pieces.
		this.boxManager.draw();
		
		// Draw selection objects.
		if (_game.getMode() === Boxt.MODE.SINGLE_PLAYER &&
			this.playerIndex === PlayingState._AIplayerIndex &&
			Boxt._diagnosticsOn) {
			this.drawGhostGems();
		}
		
		if ((_game.getMode() === Boxt.MODE.LOCAL_MULTIPLAYER ||
			this.playerIndex != PlayingState._AIplayerIndex) && this.mouseDown) {
			this.drawGhostGems();
			this.drawSelectionInfo();
		}
		else if (this.stateUpdate === this.updateWaitForPlayerAccept) {
			this.drawSelectionInfo();
		}
		
		// HACK: update the clickWait timer here so we don't have to
		// trickle it into the various update methods.
		if (this.clickWait > 0) {
			this.clickWait -= _game._dt;
		}
		
		// Draw the playerInfo objects.
		_game.playerInfoImage[0].draw(0, 0);
		_game.playerInfoImage[1].draw(ig.system.getDrawPos(_gameWidth - _game.getLevelOffsetX()), 0);
		
		this.drawScores();
		this.drawGoals();
	},
	
	stateEnter: function() {
		// Create the players.
		var playerOne = new PlayerForLocalMultiplayer(_game.playerOneImages);
		var playerTwo = null;
		
		this.clickWait = 0;
		
		this.debugBase = 0;
		
		if (_game.getMode() === Boxt.MODE.SINGLE_PLAYER) {
			playerTwo = new PlayerAI(_game.playerTwoImages);
		}
		else {
			playerTwo = new PlayerForLocalMultiplayer(_game.playerTwoImages);
		}
		
		this.players = [playerOne, playerTwo];

		// Create the selection box and the box manager.
		this.selectBox = new Box(0, 0, 0, 0, 0, _game.neutralImage, null, _game.blockedImage, _game._cellWidth, 0, this.players[this.playerIndex], 0, 0);
		this.boxManager = new BoxManager();
		
		// Add the labels to the UI manager.
		_game._uiManager.addWidget(this.infoLabel);
	},
	
	stateExit: function() {
		_game._uiManager.removeWidget(this.infoLabel);
		_game.removeEntity(this.infoLabel);

		_game.removeEntity(this.players[0]);
		_game.removeEntity(this.players[1]);
		
		this.boxManager.removeAllBoxes();
	}
});

PlayingState._AIplayerIndex = 1;


});
