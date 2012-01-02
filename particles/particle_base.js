/**
 * The base particle represents a short-lived entity that
 * interacts with no other objects.
 */

ig.module( 
	'game.particles.particle_base'
)
.requires(
	'impact.game'
)
.defines(function(){

BaseParticle = ig.Entity.extend ({
	lifeSpan:		0,
	age:			0,
	parentDraw:		null,

	init: function(x, y, settings) {
		this.parent(x, y, settings);
		
		this.lifeSpan = settings.lifeSpan;
		
		if (this.animSheet != null && settings.frameSequence != null) {
			this.animSheet = settings.animSheet;
			this.addAnim('default', settings.updateInterval, settings.frameSequence, settings.stop);
		}
		
		BaseParticle.particles.push(this);
	},
	
	update: function() {
		// Perform the default update.
		this.parent();
		
		// Only particles with positive life spans age, but
		// *very few* (if any) particles should be allowed
		// to live forever.
		if (this.lifeSpan > 0) {
			this.age += _game._dt;
			
			if (this.age >= this.lifeSpan) {
				this.kill();
				BaseParticle.particles.erase(this);
			}
		}
	},
	
	draw: function() {
		// Because particles are entities, they get drawn
		// in impact's base rendering pass. Everything else
		// in our game (the boxes and HUD), get drawn afterwards.
		// This forces the particles to appear "under" the boxes,
		// which looks wrong.
		
		// To fix this, we use a trick: instead of drawing the
		// particle during it's draw call, we record the function
		// of the base drawing method, which we call later
		// from our game's custom rendering loop.
		this.parentDraw = this.parent;
	},
	
	deferredDraw: function() {
		this.parentDraw();
	}
});

// Let the class act as the "particle manager". We can get away
// with this because our system is so simple and all particles
// have a finite, and short, life span.
BaseParticle.particles = new Array();

BaseParticle.drawDeferred = function() {
	for (var i=0; i<BaseParticle.particles.length; ++i) {
		var particle = BaseParticle.particles[i];
		if (particle != null) {
			particle.deferredDraw();
		}
	}
}

});
