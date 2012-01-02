/**
 * Manages the data human players care about in a
 * local multiplayer game.
 */

ig.module( 
	'game.players.player_local_multiplayer'
)
.requires(
	'impact.game',
	
	'game.players.player_base'
)
.defines(function(){

PlayerForLocalMultiplayer = PlayerBase.extend ({
	reasonToLive:		1
});

});
