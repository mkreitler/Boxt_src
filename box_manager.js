ig.module( 
	'game.box_manager' 
)
.requires(
	'impact.game',
	
	'game.box',
	'game.utility.util_array'
)
.defines(function(){

// Box Manager object //////////////////////////////////////////////////////////
BoxManager = ig.Class.extend ({
	init: function() {
		this.boxList = new Array();
	},
	
	getAreaUsed: function() {
		areaUsed = 0;
		
		if (this.boxList) {
			for (var i=0; i<this.boxList.length; ++i) {
				areaUsed += this.boxList[i].getArea();
			}
		}
		
		return areaUsed;
	},
	
	getIDforBoxAtCell: function(row, col) {
		var id = 0;
		
		if (this.boxList) {
			for (var i=0; i<this.boxList.length; ++i) {
				if (this.boxList[i].containsCell(row, col)) {
					id = this.boxList[i].getID();
					break;
				}
			}
		}
		
		return id;
	},
	
	removeAllBoxes: function() {
		while (this.boxList && this.boxList.length > 0) {
			var boxToRemove = this.boxList.pop();
			_game.removeEntity(boxToRemove);
		}
	},
	
	buildIDgrid: function(gridArray) {
		for (var iBox=0; iBox<this.boxList.length; ++iBox) {
			
			// Get the current box.
			box = this.boxList[iBox];
			
			for (var iRow=0; box && iRow<box.size.height; ++iRow) {
				
				// Get the current row in the world grid coordinates.
				var row = box.origin.row + iRow;
				if (row >= 0 && row < gridArray.length) {
					
					var gridRow = gridArray[row];
					if (gridRow) {
						
						// Get the current column in the world grid coordinates.
						for (var iCol=0; box && iCol<box.size.width; ++iCol) {
							var col = box.origin.col + iCol;
							
							if (col >= 0 && col < gridRow.length) {
								gridRow[col] = box.getID();
							}
						}
					}
				}
			}
		}
	},
	
	// Check the testBox against the elements in the boxList
	// to see if any overlap. Return 'true' upon finding the
	// first overlap.
	testOverlap: function(testBox) {
		bOverlap = false;
		
		var yt0 = testBox.origin.row;
		var xt0 = testBox.origin.col;
		var yt1 = yt0 + testBox.size.height - 1;
		var xt1 = xt0 + testBox.size.width - 1;
		
		for (var i=0; i<this.boxList.length; ++i) {
			var curBox = this.boxList[i];
			var yc0 = curBox.origin.row;
			var xc0 = curBox.origin.col;
			var yc1 = yc0 + curBox.size.height - 1;
			var xc1 = xc0 + curBox.size.width - 1;
			
			var bOverlapX = xt0 >= xc0 && xt0 <= xc1 ||
							xt1 >= xc0 && xt1 <= xc1 ||
							xc0 >= xt0 && xc0 <= xt1 ||
							xc1 >= xt0 && xc1 <= xt1;
							
			var bOverlapY = yt0 >= yc0 && yt0 <= yc1 ||
							yt1 >= yc0 && yt1 <= yc1 ||
							yc0 >= yt0 && yc0 <= yt1 ||
							yc1 >= yt0 && yc1 <= yt1;
							
			if (bOverlapX && bOverlapY) {
				bOverlap = true;
				break;
			}
		}
		
		return bOverlap;
	},
	
	getBoxScore: function(row, col, width, height, goal, player, playerIndex) {
		var area = width * height;
		var score = BoxManager.SCORE.OK;
		
		// Score the base area.
		if (goal === area) {
			// Perfect!
			score = BoxManager.SCORE.PERFECT;
			
		}
		else if (area > goal / 2 && area < goal * 2) {
			score = BoxManager.SCORE.GOOD;
		}
		
		// Score combos.
		var comboBonus = 0;
		var topBorder = row;
		var bottomBorder = row + height - 1;
		var leftBorder = col;
		var rightBorder = col + width - 1;
		
		// Loop through all boxes.
		for (var i=0; i<this.boxList.length; ++i) {
			var comboBox = this.boxList[i];
			
			// Only combo off valid boxes we already own.
			if (comboBox != null && comboBox.owner === player) {
				var bIsCombo = false;
				
				// There are two types of combos: "vertical stacks" where boxes
				// of equal width sit one-on-another...
				if (col === comboBox.origin.col &&
					width === comboBox.size.width) {
					// Check for vertical stack combo.
					var topTestBorder = comboBox.origin.row;
					var bottomTestBorder = comboBox.origin.row + comboBox.size.height - 1;
					
					if (topBorder - bottomTestBorder === 1 ||
						topTestBorder - bottomBorder === 1) {
						
						comboBonus += comboBox.value;
					}
				}
				// And horizontal "bump" combos, where boxes of equal height
				// abut one-another.
				else if (row === comboBox.origin.row &&
					height === comboBox.size.height) {
					// Check for horizontal bump combo.
					var leftTestBorder = comboBox.origin.col;
					var rightTestBorder = comboBox.origin.col + comboBox.size.width - 1;
					
					if (leftBorder - rightTestBorder === 1 ||
						leftTestBorder - rightBorder === 1) {
						
						comboBonus += comboBox.value;
					}
				}
			}
		}
		
		// Report the score. Note that we signal combos by returning a
		// negative score.
		var scoreOut = {score:score, comboBonus:comboBonus};
		
		return scoreOut;
	},
	
	getBoxWithID: function(boxID) {
		var box = null;
		
		for (var i=0; i<this.boxList.length; ++i) {
			if (this.boxList[i].getID() === boxID) {
				box = this.boxList[i];
				break;
			}
		}
		
		return box;
	},
	
	scoreBox: function(row, col, width, height, goal, player, playerIndex) {
		var area = width * height;
		var score = BoxManager.SCORE.OK;
		var backgroundIndex = Boxt.IMAGES.SCORE_OK;
		
		// Score the base area.
		if (goal === area) {
			// Perfect!
			score = BoxManager.SCORE.PERFECT;
			backgroundIndex = Boxt.IMAGES.SCORE_PERFECT;
			
		}
		else if (area > goal / 2 && area < goal * 2) {
			score = BoxManager.SCORE.GOOD;
			backgroundIndex = Boxt.IMAGES.SCORE_GOOD;
		}
		
		// Score combos.
		var comboBonus = 0;
		var topBorder = row;
		var bottomBorder = row + height - 1;
		var leftBorder = col;
		var rightBorder = col + width - 1;
		
		// Loop through all boxes.
		for (var i=0; i<this.boxList.length; ++i) {
			var comboBox = this.boxList[i];
			
			// Only combo off valid boxes we already own.
			if (comboBox != null && comboBox.owner === player) {
				var bIsCombo = false;
				
				// There are two types of combos: "vertical stacks" where boxes
				// of equal width sit one-on-another...
				if (col === comboBox.origin.col &&
					width === comboBox.size.width) {
					// Check for vertical stack combo.
					var topTestBorder = comboBox.origin.row;
					var bottomTestBorder = comboBox.origin.row + comboBox.size.height - 1;
					
					if (topBorder - bottomTestBorder === 1 ||
						topTestBorder - bottomBorder === 1) {
						
						comboBonus += comboBox.value;
						if (comboBox.value > 0) {
							comboBox.emit(playerIndex);
						}
					}
				}
				// And horizontal "bump" combos, where boxes of equal height
				// abut one-another.
				else if (row === comboBox.origin.row &&
					height === comboBox.size.height) {
					// Check for horizontal bump combo.
					var leftTestBorder = comboBox.origin.col;
					var rightTestBorder = comboBox.origin.col + comboBox.size.width - 1;
					
					if (leftBorder - rightTestBorder === 1 ||
						leftTestBorder - rightBorder === 1) {
						
						comboBonus += comboBox.value;
						if (comboBox.value > 0) {
							comboBox.emit(playerIndex);
						}
					}
				}
			}
		}
		
		player.addScore(score + comboBonus);
		
		return backgroundIndex;
	},
	
	addBox: function(newBox) {
		this.boxList.push(newBox);
	},
	
	removeBox: function(box) {
		this.boxList = UtilArray.removeElement(this.boxList, box);
	},
	
	draw: function() {
		for (var i=0; i<this.boxList.length; ++i) {
			this.boxList[i].draw();
		}
	}
});

BoxManager.SCORE = {
	PERFECT: 3,
	GOOD: 1,
	OK: 0
};
	
});
