/**
 * The AI player acts as an opponent in single-player
 * games. The AI players uses a brute-force combinatorics
 * method to scan all possible moves and chooses the
 * "best" based on weights for scoring, claiming area,
 * and blocking the human player.
 */

ig.module( 
	'game.players.player_ai'
)
.requires(
	'impact.game',
	
	'game.players.player_base',
	'game.box',
	'game.box_manager'
)
.defines(function(){

PlayerAI = PlayerBase.extend ({
	testRow:		0,
	testCol:		0,
	testWidth:		0,
	testHeight:		0,
	testGrid:		null,
	acceptGrid:		null,
	maxRow:			-1,
	maxCol:			-1,
	bestScore:		-1,
	bestCombo:		0,
	bestBlock:		0,
	bestRow:		0,
	bestCol:		0,
	bestWidth:		0,
	bestHeight:		0,
	nextBoxID:		0,
	acceptThresh:	0,
	testsThisFrame: 0,
	ignoreCombos:	0,
	ignoreBlocks:	0,
	
	selectBox:		null,
	boxManager:		null,
	
	_acceptThreshRange:	50,
	_testsPerFrame:		100,
	_isolationBonus:	1,
	_pointsPerBlock:	2,
	_easyThreshold:		1.0,
	_normalThreshold:	0.33,
	
	init: function(tileSets) {
		this.parent(tileSets);
		
		var numRows = _game.getGameRows();
		var numCols = _game.getGameColumns();
		
		// Create the utility grids.
		this.testGrid = new Array();
		this.acceptGrid = new Array();
		for (var i=0; i<numRows; ++i) {
			this.testGrid[i] = new Array(numCols);
			this.acceptGrid[i] = new Array(numCols);
			
			for (var j=0; j<numCols; ++j) {
				this.testGrid[i][j] = 0;
				this.acceptGrid[i][j] = 0;
			}
		}
	},
	
	scoreBlocking: function() {
		// We score blocking by tracing the perimeter of the current area,
		// noting which opponent blocks fall on our border. We earn points
		// for each new block we obstruct.
		
		var blockScore = 0;
		var blockID = 0;
		var iRow;
		var iCol;
		var isolationBonus = 0;
		var isolationCount = 0;
		
		var resultsPerSide = {top:0, left:0, bottom:0, right:0};
		
		// Top.
		iRow = this.testRow - 1;
		if (iRow >= 0 && iRow < this.testGrid.length) {
			for (iCol = this.testCol; iCol < this.testCol + this.testWidth; ++iCol) {
				var gridID = this.testGrid[iRow][iCol];
				
				// If we're blocking a new box, check to see if it has an open
				// edge. If so, award points for blocking it.
				if (gridID > 0 && gridID != blockID) {
					
					if (this.isOpenEdge(this.boxManager.getBoxWithID(gridID), Box.EDGE.BOTTOM)) {
						blockID = gridID;
						blockScore += this._pointsPerBlock;
						resultsPerSide.top += 1;
					}
				}
				else if (gridID === 0) {
					++isolationCount;
				}
			}
		}
		
		// Right.
		iCol = this.testCol + this.testWidth;
		if (iCol >= 0 && iCol < this.testGrid[0].length) {
			for (iRow = this.testRow; iRow < this.testRow + this.testHeight; ++iRow) {
				var gridID = this.testGrid[iRow][iCol];
				
				// If we're blocking a new box, check to see if it has an open
				// edge. If so, award points for blocking it.
				if (gridID > 0 && gridID != blockID) {
					
					if (this.isOpenEdge(this.boxManager.getBoxWithID(gridID), Box.EDGE.LEFT)) {
						blockID = gridID;
						blockScore += this._pointsPerBlock;
						resultsPerSide.right += 1;
					}
				}
				else if (gridID === 0) {
					++isolationCount;
				}
			}
		}
		
		// Bottom.
		iRow = this.testRow + this.testHeight;
		if (iRow >= 0 && iRow < this.testGrid.length) {
			for (iCol = this.testCol; iCol < this.testCol + this.testWidth; ++iCol) {
				var gridID = this.testGrid[iRow][iCol];
				
				// If we're blocking a new box, check to see if it has an open
				// edge. If so, award points for blocking it.
				if (gridID > 0 && gridID != blockID) {
				
					if (this.isOpenEdge(this.boxManager.getBoxWithID(gridID), Box.EDGE.TOP)) {
						blockID = gridID;
						blockScore += this._pointsPerBlock;
						resultsPerSide.bottom += 1;
					}
				}
				else if (gridID === 0) {
					++isolationCount;
				}
			}
		}
		
		// Left.
		iCol = this.testCol - 1;
		if (iCol >= 0 && iCol < this.testGrid[0].length) {
			for (iRow = this.testRow; iRow < this.testRow + this.testHeight; ++iRow) {
				var gridID = this.testGrid[iRow][iCol];
				
				// If we're blocking a new box, check to see if it has an open
				// edge. If so, award points for blocking it.
				if (gridID > 0 && gridID != blockID) {
					
					if (this.isOpenEdge(this.boxManager.getBoxWithID(gridID), Box.EDGE.RIGHT)) {
						blockID = gridID;
						blockScore += this._pointsPerBlock;
						resultsPerSide.left += 1;
					}
				}
				else if (gridID === 0) {
					++isolationCount;
				}
			}
		}

		if (isolationCount === 2 * (this.testWidth + this.testHeight)) {
			// This block has no neighbors. Give it a bonus value to
			// encourage the AI to build combo starters.
			resultsPerSide.top = -1;
			resultsPerSide.left = -1;
			resultsPerSide.bottom = -1;
			resultsPerSide.right = -1;
		}
		
		return resultsPerSide;
	},
	
	isOpenEdge: function(box, whichEdge) {
		var isOpenEdge = false;
		var maxRows = _game.getGameRows();
		var maxCols = _game.getGameColumns();
		
		if (box) {
			switch(whichEdge) {
				case Box.EDGE.TOP:
					var openCount = 0;
					var iRow = box.origin.row - 1;
					for (var iCol=box.origin.col; iRow >= 0 && iCol < box.origin.col + box.size.width; ++iCol) {
						if (this.testGrid[iRow][iCol] === 0) {
							++openCount;
						}
					}
					
					isOpenEdge = openCount === box.size.width;
				break;
			
				case Box.EDGE.RIGHT:
					var openCount = 0;
					var iCol = box.origin.col + box.size.width;
					for (var iRow=box.origin.row; iCol < this.testGrid[0].length && iRow < box.origin.row + box.size.height; ++iRow) {
						if (this.testGrid[iRow][iCol] === 0) {
							++openCount;
						}
					}
					
					isOpenEdge = openCount === box.size.height;
				break;
			
				case Box.EDGE.BOTTOM:
					var openCount = 0;
					var iRow = box.origin.row + box.size.height;
					for (var iCol=box.origin.col; iRow < this.testGrid.length && iCol < box.origin.col + box.size.width; ++iCol) {
						if (this.testGrid[iRow][iCol] === 0) {
							++openCount;
						}
					}
					
					isOpenEdge = openCount === box.size.width;
				break;
			
				case Box.EDGE.LEFT:
					var openCount = 0;
					var iCol = box.origin.col - 1;
					for (var iRow=box.origin.row; iCol >= 0 && iRow < box.origin.row + box.size.height; ++iRow) {
						if (this.testGrid[iRow][iCol] === 0) {
							++openCount;
						}
					}
					
					isOpenEdge = openCount === box.size.height;
				break;
			}
		}
		
		return isOpenEdge;
	},
	
	scoreCurrentTest: function() {
		// Compute the weighted value of the current test region.
		// If it exceeds the current best value, consider adopting
		// it as the new best region.
		var acceptCheck = this.acceptGrid[this.testRow][this.testCol] /
						  (Math.abs(this.testWidth - this.testHeight) + 1);
							  
		
		// We composite scores from 2 categories:
		// 1) Points: what the area's worth, including combos.
		// 2) Block: how much the area obstructs the opponent.
		var testValue = this.boxManager.getBoxScore(this.testRow,
													this.testCol,
													this.testWidth,
													this.testHeight,
													this.getGoal(),
													this,
													PlayingState._AIplayerIndex);
		
		var testScore = testValue.score;
		var testCombo = testValue.comboBonus;
		
		// Add points for moves that block the opponent.
		var blockingResults = this.scoreBlocking();
		var blockBonus = 0;
		
		// Compute the score bonus resulting from blocks on multiple
		// sides.
		if (blockingResults.top > 0) blockBonus += 1;
		if (blockingResults.left > 0) blockBonus += 1;
		if (blockingResults.bottom > 0) blockBonus += 1;
		if (blockingResults.right > 0) blockBonus += 1;
		blockBonus = Math.max(blockBonus - 1, 0);
		
		var blockScore = blockingResults.top +
						 blockingResults.right +
						 blockingResults.bottom +
						 blockingResults.left;
						 
		if (blockScore === -4) {
			// This block is isolated.
			blockScore = this._isolationBonus;
		}
		else if (blockScore > 0) {
			// Any block at all is better than isolation.
			blockScore += this._isolationBonus;
		}
		
		if (this.ignoreCombos) {
			testCombo = 0;
		}
		
		if (this.ignoreBlocks) {
			blockBonus = 0;
			blockScore = 0;
		}

		var totalScore = testScore + testCombo + blockBonus;
		
		var acceptMove = false;
		if (totalScore > this.bestScore + this.bestCombo) {
			acceptMove = true;
		}
		else if (totalScore === this.bestScore + this.bestCombo && testValue.score > 0) {
			// Check for acceptance of a move that's as good as our current best move.
			// Since we iterate from upper left to lower right, we need a system to
			// prevent the AI from clustering moves in a single region.
			
			// For example, if
			// we never accepted a move equal to our current one, the AI would tend to
			// add boxes to the upper left. Conversely, if we always accepted moves of
			// value equal to the current best, moves would cluster in the lower right.
			//
			// One crude solution is to use a random number of sufficient size as a
			// "ratchet" that prevents some solutions from acceptance. In our case, we
			// generate a grid of "acceptance values" that has the same dimensions as
			// the game board. When a test registers the same value as the current best
			// test, we check the value at that point in the grid versus the current
			// acceptThresh. If the grid value exceeds the acceptThresh, we adopt the
			// new test result and set the acceptThresh to the grid value.
			//
			// One last note: we bias toward more square shapes by subtracting the
			// absolute value of the difference between width and height from the
			// geometrical acceptance value.
			if (testCombo < this.bestCombo || blockScore > this.bestBlock) {
				// Auotmatically accept a move that requires less comboing or
				// results in more blocking than the current move.
				acceptMove = true;
			}
			else if (testCombo <= this.bestCombo && blockScore >= this.bestBlock) {
				acceptMove = acceptCheck > this.acceptThresh;
			}
		}
			
		if (acceptMove) {
			this.acceptThresh = acceptCheck;
								
			this.bestScore = testScore + blockBonus;
			this.bestCombo = testCombo;
			this.bestBlock = blockScore;
			this.bestRow = this.testRow;
			this.bestCol = this.testCol;
			this.bestWidth = this.testWidth;
			this.bestHeight = this.testHeight;
			
			// Flash the selectBox red so we can see the decision to
			// score this box.
			this.selectBox.setInvalid(true);
		}
	},
	
	// Generates a list of possible moves, then chooses
	// from among them. Returns 'true' after making the move.
	think: function() {
		var newBox = null;
		var result = null;
		var testsPerFrame = this._testsPerFrame;
		
		// Lesser AI players miss opportunities to combo and block.
		this.ignoreCombos = false;
		this.ignoreBlocks = false;
		if (PlayerAI._difficulty === PlayerAI.DIFFICULTY.EASY) {
			if (Math.random() < this._easyThreshold) {
				this.ignoreCombos = true;
				this.ignoreBlocks = true;
			}
		}
		else if (PlayerAI._difficulty === PlayerAI.DIFFICULTY.NORMAL) {
			if (Math.random() < this._normalThreshold) {
				this.ignoreCombos = true;
				this.ignoreBlocks = true;
			}
		}
		
		this.testsThisFrame = 0;
		
		if (Boxt._diagnosticsOn) {
			// If diagnostics are on, we want to see every test.
			testsPerFrame = 1;
		}
		
		this.selectBox.setInvalid(false);
		
		do {
			result = this.testBox();

			if (result === PlayerAI.TEST_RESULT.SCORE) {
				this.scoreCurrentTest();
				
				// Update the selection info to show the testing region.
				this.selectBox.setPositionInfo(this.testRow, this.testCol, this.testWidth, this.testHeight);
				
				// TODO: change the valid/invalid flag to reflect which regions we've
				// decided to keep vs those we're throwing away.
				// this.selectBox.setInvalid(this.boxManager.testOverlap(this.selectBox));
				
				// Move to the next column.
				this.testWidth += 1;
				
				this.testsThisFrame += 1;
				if (this.testsThisFrame < testsPerFrame) {
					// We haven't executed enough tests yet this frame.
					// Perform another.
					result = PlayerAI.TEST_RESULT.TEST_AGAIN;
				}
			}
			else if (result === PlayerAI.TEST_RESULT.DONE) {
				// The current test has ended. Move to the next one.
				this.startNewTest();
				
				// Change the location of the test.
				while(true) {
					this.testCol += 1;
					if (this.testCol >= _game.getGameColumns()) {
						// Out of bounds. Jump to the next row.
						this.testCol = 0;
						this.testRow += 1;
						if (this.testRow >= _game.getGameRows()) {
							// We've dropped off the bottom of the board.
							// The AI update is complete.
							result = PlayerAI.TEST_RESULT.COMPLETE;
							
							// We've completed the analysis. Create a box corresponding
							// to our best result.
							newBox = new Box(this.nextBoxID,
											 this.bestRow,
											 this.bestCol,
											 this.bestWidth,
											 this.bestHeight,
											 this.getBackTileSet(Boxt.IMAGES.UNSCORED),
											 this.getEdgeTileSet(),
											 null,
											 _game._cellWidth,
											 this.bestScore + this.bestCombo,
											 this,
											 _game.getLevelOffsetX() + this.bestCol * _game._cellWidth,
											 this.bestRow * _game._cellHeight);
							break;
						}
					}
					
					// Check for obstruction.
					if (this.testGrid[this.testRow][this.testCol] <= 0) {
						// Unclaimed. We can test from here.
						break;
					}
				}
			}
		} while (result != PlayerAI.TEST_RESULT.SCORE && result != PlayerAI.TEST_RESULT.COMPLETE);
		
		return newBox;
	},
	
	// 'testBox' evaluates the box defined by testRow, testCol,
	// testWidth, and testHeight. It returns the following
	// results:
	//
	// SCORE	-- indicates a valid box that should be scored.
	// NEXT_ROW	-- indicates the test should proceed to the next row.
	// NEXT_COL -- indicates the test should proceed to the next column.
	// DONE		-- indicates all tests have ended for this frame.
	testBox: function() {
		var result  = PlayerAI.TEST_RESULT.SCORE;
		var blocked = false;
		var maxRow = _game.getGameRows();

		// Test current row and column to keep them in bounds.
		if (this.testCol + this.testWidth - 1 > this.maxCol) {
			// We've moved past the right side of the board. Drop to
			// the next row.
			result = PlayerAI.TEST_RESULT.NEXT_ROW;
		}
		else if (this.testWidth * this.testHeight > Box._maxArea) {
			// We've exceeded the maxmimum area. Tests on lower
			// rows can't extend to this column without also
			// violating the maxArea restriction, so we limit
			// the max column used for the rest of this test.
			this.maxCol = this.testCol + this.testWidth - 2;
			result = PlayerAI.TEST_RESULT.NEXT_ROW;
		}
		else {
			// Now test the leading corner for obstruction. If the opposing
			// player has claimed the cell we want, drop to the next row.
			if (this.testGrid[this.testRow + this.testHeight - 1][this.testCol + this.testWidth - 1] > 0) {
				// Blocked by the human player. This column will be blocked
				// for the remainder of this test.
				this.maxCol = this.testCol + this.testWidth - 2;
				result = PlayerAI.TEST_RESULT.NEXT_ROW;
			}
		}
		
		if (result === PlayerAI.TEST_RESULT.NEXT_ROW) {
			// Drop to the next row.
			this.testWidth = 1;
			this.testHeight += 1;
			
			// Start fresh, hoping to score.
			result = PlayerAI.TEST_RESULT.SCORE;
			
			// Bounds check.
			if (this.testRow + this.testHeight - 1 >= maxRow) {
				// We've reached past the end of the board. It's
				// time to start a new test.
				result = PlayerAI.TEST_RESULT.DONE;
			}
			// There's no area check, because we can't violate the maxArea
			// restriction when testWidth resets to 1.
			//
			// Check for obstruction.
			else if (this.testGrid[this.testRow + this.testHeight - 1][this.testCol + this.testWidth - 1] > 0) {
				// Blocked by human player. We can reach no further
				// on this test.
				result = PlayerAI.TEST_RESULT.DONE;
			}
		}
		
		return result;
	},
	
	generateAcceptGrid: function() {
		for (var iRow = 0; iRow < this.acceptGrid.length; ++iRow) {
			for (var iCol = 0; iCol < this.acceptGrid[0].length; ++iCol) {
				this.acceptGrid[iRow][iCol] = parseInt(Math.random() * this._acceptThreshRange);
			}
		}
	},
	
	startTurn: function(selectBox, boxManager, boxID) {
		if (selectBox && boxManager) {
			// Borrow the level's selection box.
			this.selectBox = selectBox;
			this.boxManager = boxManager;
			this.nextBoxID = boxID;
			
			// Reset test variables.
			this.testRow = 0;
			this.testCol = 0;
			this.testWidth = 1;
			this.testHeight = 1;
			
			this.bestRow = -1;
			this.bestCol = -1;
			this.bestWidth = 0;
			this.bestHeight = 0;
			this.bestScore = -1;
			this.bestCombo = 0;
			this.bestBlock = 0;
			
			this.startNewTest();
			
			this.generateAcceptGrid();
			
			this.acceptThresh = -1;
			
			// Update test grid.
			this.boxManager.buildIDgrid(this.testGrid);
		}
		else {
			this.selectBox = null;
		}
	},
	
	startNewTest: function() {
		this.maxRow = _game.getGameRows() - 1;
		this.maxCol = _game.getGameColumns() - 1;
		this.testWidth = 1;
		this.testHeight = 1;
	}
})

PlayerAI.TEST_RESULT = {
	SCORE:		0,
	NEXT_ROW:	1,
	NEXT_COL:	2,
	DONE:		3,
	COMPLETE:	4,
	TEST_AGAIN:	5,
	
	NUM_TEST_RESULTS: 6
};

PlayerAI.DIFFICULTY = {
	EASY:		0,
	NORMAL:		1,
	HARD:		2,
	
	NUM_DIFFICULTY_LEVELS: 3
};

PlayerAI._difficulty = PlayerAI.DIFFICULTY.NORMAL;
PlayerAI.setDifficulty = function(newDifficulty) {
	PlayerAI._difficulty = newDifficulty;
};

});
