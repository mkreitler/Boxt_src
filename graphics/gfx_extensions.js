ig.module( 
	'game.graphics.gfx_extensions' 
)
.requires(
)
.defines(function(){

if (window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype.lineTo) {
	CanvasRenderingContext2D.prototype.dashedLine = function(x, y, x2, y2, dashArray, start) {
        if (x > x2) {
            var temp = x;
            x = x2;
            x2 = temp;
        }
        
        if (y > y2) {
            var temp = y;
            y = y2;
            y2 = temp;
        }
        
		if (!dashArray) dashArray = [10, 5];
		var dashCount = dashArray.length;
		var dashSize = 0;
		for (i = 0; i < dashCount; i++) dashSize += parseInt(dashArray[i]);
		var dx = (x2 - x),
			dy = (y2 - y);
		var slopex = (dy < dx);
		var slope = (slopex) ? dy / dx : dx / dy;
		var dashOffSet = dashSize * (1 - (start / 100))
		if (slopex) {
			var xOffsetStep = Math.sqrt(dashOffSet * dashOffSet / (1 + slope * slope));
			x -= xOffsetStep;
			dx += xOffsetStep;
			y -= slope * xOffsetStep;
			dy += slope * xOffsetStep;
		} else {
			var yOffsetStep = Math.sqrt(dashOffSet * dashOffSet / (1 + slope * slope));
			y -= yOffsetStep;
			dy += yOffsetStep;
			x -= slope * yOffsetStep;
			dx += slope * yOffsetStep;
		}
		this.moveTo(x, y);
		var distRemaining = Math.sqrt(dx * dx + dy * dy);
		var dashIndex = 0,
			draw = true;
		while (distRemaining >= 0.1 && dashIndex < 10000) {
			var dashLength = dashArray[dashIndex++ % dashCount];
			if (dashLength > distRemaining) dashLength = distRemaining;
			if (slopex) {
				var xStep = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
				x += xStep
				y += slope * xStep;
			} else {
				var yStep = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
				y += yStep
				x += slope * yStep;
			}
			if (dashOffSet > 0) {
				dashOffSet -= dashLength;
				this.moveTo(x, y);
			} else {
				this[draw ? 'lineTo' : 'moveTo'](x, y);
			}
			distRemaining -= dashLength;
			draw = !draw;
		}
		// Ensure that the last segment is closed for proper stroking
		this.moveTo(0, 0);
	}
}


});
