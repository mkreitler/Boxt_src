ig.module( 
	'game.box' 
)
.requires(
	'impact.game',
	
	'game.particles.particle_base'
)
.defines(function(){

Box = ig.Class.extend ({
	// The box ID uniquely identifies it from all others, and
	// provides a quick way to test ownership (box '0' is the
	// selection box, owned by no one; boxes with IDs > 0 belong
	// to player 1, and boxes with IDs < 0 belong to player 2).
	// Currently, only the AI player uses these IDs.
	id:				0,
	
	origin:   		{col:0, row:0},
	size:     	 	{width:0, height:0},
	tileSize: 		0,
	points:    		0,
	tiles:	   		null,
	tileSet: 		null,
	blockedTileSet:	null,
	borderTileSet:	null,
	value:			0,
	screenOrigin:	{x:0, y:0},
	_areaLarge:		16,
	_areaSmall:		4,
	_largeSide:		9,
	_emitSpeed:		90,
	
	init: function(id,
				   row,
				   col,
				   width,
				   height,
				   image,
				   borderImage,
				   blockedImage,
				   tileSize,
				   pointValue,
				   owningPlayer,
				   screenOriginX,
				   screenOriginY) {
		
		this.id				= id;
		this.origin.col 	= col;
		this.origin.row 	= row;
		this.size.width 	= width;
		this.size.height	= height;
		this.tileSize   	= tileSize;
		this.points     	= pointValue;
		this.normalTileSet	= image;
		this.borderTileSet	= borderImage;
		this.blockedTileSet = blockedImage;
		this.value			= 0;
		this.owner			= owningPlayer;
		this.screenOrigin.x	= screenOriginX;
		this.screenOrigin.y	= screenOriginY;
		
		this.tileSet = this.normalTileSet;
	},
	
	setID: function(id) {
		this.id = id;
	},
	
	getID: function() {
		return this.id;
	},
	
	getArea: function() {
		return this.size.width * this.size.height;
	},
	
	emit: function(playerIndex) {
		var emitPoint = {x:0, y:0};
		var emitVelocity = {x:0, y:0};
		var numParticles = 0;
		
		var animSheetIndex = Boxt.ANIMSHEETS.SWIRLS;
		if (this.value === BoxManager.SCORE.PERFECT) {
			animSheetIndex = Boxt.ANIMSHEETS.STARS;
		}

		var area = this.size.width * this.size.height;
		numParticles = 3;
		if (area > this._areaLarge ||
			this.size.width > this._largeSide ||
			this.size.height > this._largeSide) {
			numParticles = 1;
		}
		else if (area >= this._areaSmall) {
			numParticles = 2;
		}

		// Loop through every cell in this box, generating an emitter location
		// and emission velocity. Then, emit several particles using these
		// parameters.
		for (var iRows = 0; iRows < this.size.height; ++iRows) {
			emitPoint.y = this.screenOrigin.y + iRows * _game._cellHeight + (16 - 20);
			
			for (var iCols = 0; iCols < this.size.width; ++iCols) {
				emitPoint.x = this.screenOrigin.x + iCols * _game._cellWidth + (16 - 20);
				
				for (var iNum = 0; iNum < numParticles; ++iNum) {
				
					var totalRows = _game.getGameRows();
					var totalCols = _game.getGameColumns();
					
					var speed = this._emitSpeed + this._emitSpeed * Math.random();
			
					// Do some shenanigans with velocity to favor particles that
					// move away from the edges of the screen.
					var weightLeft = Math.min(this.origin.col / totalCols * 4, 1);
					var weightRight = Math.min((totalCols - this.origin.col) / totalCols * 4, 1);
					var leftRight = Math.random() * weightRight - Math.random() * weightLeft;
			
					var weightUp = Math.min(this.origin.row / totalRows * 4, 1);
					var weightDown = Math.min((totalRows - this.origin.row) / totalRows * 4, 1);
					var upDown = Math.random() * weightDown - Math.random() * weightUp;
					
					// Ensure a normalizeable velocity.
					if (Math.abs(upDown) < _epsilon) {
						upDown = 1;
					}
					
					if (Math.abs(leftRight) < _epsilon) {
						leftRight = 1;
					}
					
					// Normalize the direction.
					var vLen = Math.sqrt(upDown * upDown + leftRight * leftRight);
					
					// Combine direction and magnitude into a velocity vector.
					emitVelocity.x = leftRight / vLen * speed;
					emitVelocity.y = upDown / vLen * speed;
					
					// Spawn the particle.
					var settings = {vel:{x:emitVelocity.x, y:emitVelocity.y},
									lifeSpan:1,
									animSheet:_game.getAnimSheet(animSheetIndex, playerIndex),
									updateInterval:0.125,
									frameSequence:[0, 1, 2, 3, 4, 5, 6, 7],
									stop: true};
									
					_game.spawnEntity(BaseParticle, emitPoint.x, emitPoint.y, settings);
				}
			}
		}
	},
	
	setValue: function(newValue) {
		this.value = newValue;
	},
	
	setTileSet: function(newTileSet) {
		this.tileSet = newTileSet;
	},
	
	setOwner: function(thePlayer) {
		this.owner = thePlayer;
	},

	isTooBig: function() {
		return (this.size.width * this.size.height > Box._maxArea);
	},
	
	setPositionInfo: function(row, col, width, height) {
		this.origin.col = col;
		this.origin.row = row;
		this.size.width = width;
		this.size.height= height;
	},
	
	isBlocked: function() {
		return this.tileSet === this.blockedTileSet;
	},
	
	setInvalid: function(isBlocked) {
		if (isBlocked || this.isTooBig()) {
			this.tileSet = this.blockedTileSet;
		}
		else {
			this.tileSet = this.normalTileSet;
		}
	},
	
	setValue: function(newValue) {
		this.value = newValue;
	},
	
	containsPoint: function(x, y) {
		var boxX = this.origin.col * _game._cellWidth;
		var boxY = this.origin.row * _game._cellHeight;
		var boxWidth = this.size.width * _game._cellWidth;
		var boxHeight = this.size.height * _game._cellHeight;
		
		return ((boxX <= x && x <= boxX + boxWidth) &&
				(boxY <= y && y <= boxY + boxHeight));
			
	},
	
	containsCell: function(row, col) {
		return row >= this.origin.row &&
			   row <= this.origin.row + this.size.height - 1 &&
			   col >= this.origin.col &&
			   col <= this.origin.col + this.size.width - 1;
	},
	
	drawBorder: function(startRow, startCol, endRow, endCol, offsetX, offsetY) {
		if (this.borderTileSet != null) {
			if (this.size.width === 1 && this.size.height === 1) {
				// Draw single cell.
				var drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
				var drawY = ig.system.getDrawPos(startRow * this.tileSize + ig.game.screen.y + offsetY);
				
				this.borderTileSet.drawTile(drawX, drawY, 0, this.tileSize / 2);
				this.borderTileSet.drawTile(drawX + this.tileSize / 2, drawY, 5, this.tileSize / 2);
				this.borderTileSet.drawTile(drawX, drawY + this.tileSize / 2, 30, this.tileSize / 2);
				this.borderTileSet.drawTile(drawX + this.tileSize / 2, drawY + this.tileSize / 2, 35, this.tileSize / 2);
			}
			else if (this.size.width === 1) {
				// Draw a vertical strip with proper caps.
				for (var i=startRow; i<=endRow; ++i) {
					if (i === startRow) {
						var drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 0, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(startCol * this.tileSize + this.tileSize / 2 + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 5, this.tileSize / 2);
						
						drawY = ig.system.getDrawPos(i * this.tileSize + this.tileSize / 2 + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 11, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 6, this.tileSize / 2);
					}
					else if (i === endRow) {
						var drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 24, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(startCol * this.tileSize + this.tileSize / 2 + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 29, this.tileSize / 2);
						
						drawY = ig.system.getDrawPos(i * this.tileSize + this.tileSize / 2 + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 35, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 30, this.tileSize / 2);
					}
					else {
						var drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 12, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(startCol * this.tileSize + this.tileSize / 2 + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 17, this.tileSize / 2);
						
						drawY = ig.system.getDrawPos(i * this.tileSize + this.tileSize / 2 + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 23, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(startCol * this.tileSize + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 18, this.tileSize / 2);
					}
				}
			}
			else if (this.size.height === 1) {
				// Draw a horizontal strip with proper caps.
				for (var i=startCol; i<=endCol; ++i) {
					if (i === startCol) {
						var drawX = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(startRow * this.tileSize + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 0, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(i * this.tileSize + this.tileSize / 2 + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 1, this.tileSize / 2);
						
						drawY = ig.system.getDrawPos(startRow * this.tileSize + this.tileSize / 2 + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 31, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 30, this.tileSize / 2);
					}
					else if (i === endCol) {
						var drawX = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(startRow * this.tileSize + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 4, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(i * this.tileSize + this.tileSize / 2 + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 5, this.tileSize / 2);
						
						drawY = ig.system.getDrawPos(startRow * this.tileSize + this.tileSize / 2 + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 35, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 34, this.tileSize / 2);
					}
					else {
						var drawX = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(startRow * this.tileSize + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 2, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(i * this.tileSize + this.tileSize / 2 + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 3, this.tileSize / 2);
						
						drawY = ig.system.getDrawPos(startRow * this.tileSize + this.tileSize / 2 + ig.game.screen.y + offsetY);
						this.borderTileSet.drawTile(drawX, drawY, 33, this.tileSize / 2);
						
						drawX = ig.system.getDrawPos(i * this.tileSize + ig.game.screen.x + offsetX);
						this.borderTileSet.drawTile(drawX, drawY, 32, this.tileSize / 2);
					}
				}
			}
			else {
				// Loop through desired area, drawing the tiles.
				for (var iRow = startRow; iRow <= endRow; ++iRow) {
					var rowIndex = 1;
					if (iRow === startRow) rowIndex = 0;
					if (iRow === endRow) rowIndex = 2;
					
					for (var iCol = startCol; iCol <= endCol; ++iCol) {
						var colIndex = 1;
						if (iCol === startCol) colIndex = 0;
						if (iCol === endCol) colIndex = 2;
						
						var cellIndex = rowIndex * 3 + colIndex;
						
						var drawX = ig.system.getDrawPos(iCol * this.tileSize + ig.game.screen.x + offsetX);
						var drawY = ig.system.getDrawPos(iRow * this.tileSize + ig.game.screen.y + offsetY);
						
						this.borderTileSet.drawTile(drawX, drawY, cellIndex, this.tileSize);
					}
				}
			}
		}
	},
	
	draw: function() {
		var startRow = this.origin.row;
		var startCol = this.origin.col;
		var endRow   = startRow + this.size.height - 1;
		var endCol   = startCol + this.size.width - 1;
		
		// Always draw from upper left to lower right.
		if (startRow > endRow) {
			var temp = startRow;
			startRow = endRow;
			endRow   = temp;
		}
		
		if (startCol > endCol) {
			var temp = startCol;
			startCol = endCol;
			endCol   = temp;
		}

		var offsetX = _game.getLevelOffsetX();
		var offsetY = _game.getLevelOffsetY();
				
		// Draw the background.
		if (this.tileSet != null) {
			// Loop through desired area, drawing the tiles.
			for (var iRow = startRow; iRow <= endRow; ++iRow) {
				var rowIndex = iRow % 3;
				
				for (var iCol = startCol; iCol <= endCol; ++iCol) {
					var colIndex = iCol % 3;
					
					var cellIndex = rowIndex * 3 + colIndex;
					
					var drawX = ig.system.getDrawPos(iCol * this.tileSize + ig.game.screen.x + offsetX);
					var drawY = ig.system.getDrawPos(iRow * this.tileSize + ig.game.screen.y + offsetY);
					
					this.tileSet.drawTile(drawX, drawY, cellIndex, this.tileSize);
				}
			}
		}
		
		// Draw the border.
		this.drawBorder(startRow, startCol, endRow, endCol, offsetX, offsetY);
	}
});

Box._maxArea = 42;

Box.EDGE = {
	TOP:		0,
	RIGHT:		1,
	BOTTOM:		2,
	LEFT:		3
};

});
