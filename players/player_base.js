/**
 * Generic player class.
 * Tracks score and manages sequence of box pieces.
 */

ig.module( 
	'game.players.player_base'
)
.requires(
	'impact.game',
	
	'game.box'
)
.defines(function(){

PlayerBase = ig.Class.extend ({
	_perfectPoints:	3,
	_goodPoints:	1,
	_okPoints:		0,
	_maxPieces:		20,
	pieceOrder:		null,
	totalScore:		0,
	tileSets:		null,
	goalIndex:		-1,
	_smallestPiece:	4,
	
	init: function(tileSets) {
		this.tileSets = tileSets;		
		
		// Create the pieces.
		var numPieces = this._maxPieces - this._smallestPiece + 1;
		this.pieceOrder = new Array(numPieces);
		for (var i=0; i<numPieces; ++i) {
			this.pieceOrder[i] = i + this._smallestPiece;
		}
		
		// Randomize the order.
		for (i=0; i<numPieces; ++i) {
			var swapIndex = parseInt(Math.random() * numPieces);
			if (swapIndex != i) {
				var temp = this.pieceOrder[i];
				this.pieceOrder[i] = this.pieceOrder[swapIndex];
				this.pieceOrder[swapIndex] = temp;
			}
		}
		
		this.goalIndex = 0;
		this.totalScore = 0;
	},
	
	tileSetForIndex: function(index) {
		return this.tileSets ? this.tileSets[index] : null;	
	},

	getGoal: function() {
		var goal = -1;
		
		if (this.goalIndex >= 0 && this.goalIndex < this.pieceOrder.length) {
			goal = this.pieceOrder[this.goalIndex];
		}
		
		return goal;
	},
	
	getOffsetGoal: function(offset) {
		var nextGoal = -1;
		
		if (this.goalIndex + offset >= 0 && this.goalIndex + offset < this.pieceOrder.length) {
			nextGoal = this.pieceOrder[this.goalIndex + offset];
		}
		
		return nextGoal;
	},
	
	getScore: function() {
		return this.totalScore;
	},
	
	addScore: function(points) {
		this.totalScore += points;
	},
	
	nextTurn: function() {
		this.goalIndex++;
	},
	
	getBackTileSet: function(index) { return this.tileSets && index >= 0 && index < this.tileSets.length - 1 ? this.tileSets[index] : null; },
	getEdgeTileSet: function() { return this.tileSets ? this.tileSets[Boxt.IMAGES.BORDER] : null; },
	
	getPiece: function(forTurn) {
		var piece = 0;
		
		if (forTurn < this._maxPieces) {
			piece = this.pieceOrder[forTurn];
		}
		
		return piece;
	},
	
	addToScore: function(points) {
		this.score += points;
	}
});

});
