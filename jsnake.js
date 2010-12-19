/* JSnake - Online snake game
 * Copyright (C) 2010 Anton Pirogov
 */

/* implement indexOf if not present */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, fromIndex) {
        if (fromIndex == null) {
            fromIndex = 0;
        } else if (fromIndex < 0) {
            fromIndex = Math.max(0, this.length + fromIndex);
        }
        for (var i = fromIndex, j = this.length; i < j; i++) {
            if (this[i] === obj)
                return i;
        }
        return -1;
    };
}


// Simple way to attach js code to the canvas is by using a function
function sketch(p) {

	/* no more than one movement per frame to prevent 180° turns */
	var movementlock=false;
	var pause=false;
	var gameover=false;

	/* Snake fragment coordinates */
	var sx = new Array();
	var sy = new Array();
	var sc = new Array(); /* snake color */

	/* Field pieces/food coordinates */
	var fx = new Array();
	var fy = new Array();
	var fc = new Array(); /* snake color */
	var ft = new Array(); /* food spawn time */
	var fv = new Array(); /* food value */

	/* Snake movement direction */
	var dx = 1;
	var dy = 0;
	var score=0;

	/* settings */
	var cellsize=16;		/* size of a single food/snake cell */
	var classicmode=false;	/* auto spawn, valued food, aging, walls? or classic good old snake? */
	var walls=false;		/* walls = death or left -> comes from right? */
	var maxage=100;			/* frames a food piece is allowed to live (0=no aging)*/

	var backgroundimg = p.loadImage("background.png"); /* pre-rendered background */
	var txtfont = p.loadFont("Courier New");  

	/* prints something into debug div */
	function printDebug(obj) {
		document.getElementById("debug").innerHTML+=obj;
	}

	/* generate a random color */
	function randSnakeClr() {
		return p.color(p.random(0,128),p.random(0,128),p.random(0,128));
	}

	/* adds a new piece of food... searches for an empty place */
	function spawnFood() {
		var x,y;
		do {
			x=p.int(p.random(0,p.width/cellsize-1))
			y=p.int(p.random(0,p.height/cellsize-1))
		} while((fx.indexOf(x)!=-1 && fy.indexOf(y)!=-1) || (sx.indexOf(x)!=-1 && sy.indexOf(y)!=-1)) /* place not empty */

		fx.push(x);
		fy.push(y);
		fc.push(randSnakeClr());
		ft.push(p.frameCount);

		if (classicmode)
			fv.push(1);
		else {
			var val = p.int(p.random(1,9));
			if (p.int(p.random(0,3))==0)
				val *= -1;
			fv.push(val);
		}
	}
	
	function moveSnake() {
		sx.pop();
		sy.pop();
		sx.unshift(sx[0]+dx);
		sy.unshift(sy[0]+dy);
	}

	
	function checkCollideFood() {
		var cfi=0;
		var i=0;

		while (!(sx[0]==fx[i] && sy[0]==fy[i]) && i<fx.length)
			i++;
		
		if (i==fx.length) //no match
			cfi = -1;
		
		cfi = i;	//collided food piece index

		if (cfi != -1) { /* got food */
			/* remove food from field */
			var c = fc.splice(cfi, 1);
			var x = fx.splice(cfi, 1);
			var y = fy.splice(cfi, 1);
			var v = fv.splice(cfi, 1);
			ft.splice(cfi,1);

			/* positive value -> add to snake */
			if(v>0) {
				for(var i=0; i<v; i++) {
					sx.push(x);
					sy.push(y);
					sc.push(c);
				}
				if (classicmode)
					spawnFood();
			}
			else /* negative -> shorten snake (not smaller than 3) */
				for(var i=0; i<-v && sx.length>3; i++) {
					sx.pop();
					sy.pop();
					sc.pop();
				}

			/* increase + update score */
			if (v>0)
				score += v*2; /* positive -> twice the number of pieces */
			else
				score += -v; /* negative -> score the number of removed pieces */
			$("#score").html(score);

		}

	}

	function checkDeath() {
		 /* crashed wall? */
			if (sx[0]<0 || sy[0]<0 || sx[0]>=(p.width / cellsize) || sy[0] >= (p.height / cellsize))
				if (walls) { /* wall -> dead */
					printMessage("GAME OVER", p.color(255,0,0));
					gameover=true;
				} else { /* go-through walls */
					if (sx[0]<0)
						sx[0]=p.width/cellsize-1;
					if (sy[0]<0)
						sy[0]=p.height/cellsize-1;
					if (sx[0]>=p.width/cellsize)
						sx[0]=0;
					if (sy[0]>=p.height/cellsize)
						sy[0]=0;
				}

		/* crashed itself? */
		var i=1;
		while (!(sx[0]==sx[i] && sy[0]==sy[i]) && i<sx.length)
			i++;
		if (i==sx.length) //no match
			i=-1;

		if (i != -1) {
			printMessage("GAME OVER", p.color(255,0,0));
			gameover=true;
		}
	}

	function removeOldFood() {
		/* check for bad(old) food and remove it, decrease score */
		if(maxage) /* aging active (>0) */
			for(var i=0; i<ft.length; i++) {
				if ((p.frameCount-ft[i]) > maxage) { /* older than 10 secs */
					fx.splice(i,1);
					fy.splice(i,1);
					fc.splice(i,1);
					ft.splice(i,1);
					score-=Math.abs(fv.splice(i,1));
					if (score<0)
						score=0;
					$("#score").html(score);
						i--;
				}
			}
	}

	/* init */
	p.setup = function() {
		/* Read settings from menu */
		classicmode = $("#chk_clmode").attr("checked");
		walls = $("#chk_walls").attr("checked");
		if ($("#sz_large").attr("checked"))
			cellsize = 16;
		else if($("#sz_medium").attr("checked"))
			cellsize = 20;
		else if($("#sz_small").attr("checked"))
			cellsize = 32;

		$("#score").html(score);

		if (classicmode) { /* no aging of food in classic mode, enable walls */
			maxage=0;
			walls=true;
		}

		p.frameRate(10);
		p.textFont(txtfont, cellsize*0.9);

		/* init snake */
		for(var i=3; i>0; i--) {
			sx.push(i);
			sy.push(0);
			sc.push(randSnakeClr());
		}

		spawnFood();
	};

	function drawBackground(frompic) {
		if (frompic) /* load from file (much faster) */
			p.image(backgroundimg,0,0);
		else {
			/* canvas center */
			var cx=p.width/2;
			var cy=p.height/2;

			p.background(40);
			p.noFill();
			p.strokeWeight(2);

			for(var r=0; r<cx*2; r++) {
				var clr = 222-r/3;
				if (clr<80)
					clr=80;
				p.stroke(clr);
				p.ellipse(cx,cy,2*r,2*r*(cy/cx));
			}
		}
	}

	function printMessage(str, clr) {
		if (clr)
			p.fill(clr);
		p.textFont(txtfont, 80)
		p.text(str,p.width/2-p.textWidth(str)/2,p.height/2-40)
		p.textFont(txtfont, cellsize*0.9)
	}

	p.draw = function() {
		movementlock = false; /* accept keys */

		if (gameover)
			return;

		/* If paused, wait to unpause and do nothing */
		if (pause) {
			printMessage("GAME PAUSED");
			return;
		}

		drawBackground(true);

		p.stroke(0);
		p.strokeWeight(1);

		/* draw awesome snake */
		for(var i=0; i<sx.length; i++)
			for(var j=0; j<cellsize/2; j++) {
				p.stroke(p.color(p.red(sc[i])+j*4, p.green(sc[i])+j*4, p.blue(sc[i])+j*4));
				p.rect(cellsize*sx[i]+j,cellsize*sy[i]+j,cellsize-2*j,cellsize-2*j);
			}

		/* draw food pieces (old ones get transparent) */
		for(var i=0; i<fx.length; i++) {
			var age = p.frameCount - ft[i];
			if (maxage == 0) /* no aging set */
				age = 0;

			var alpha = 255-p.int(age/maxage*250);

			for(var j=0; j<cellsize/2; j++) {
				p.stroke(p.color(p.red(fc[i])+j*4, p.green(fc[i])+j*4, p.blue(fc[i])+j*4, alpha));
				p.rect(cellsize*fx[i]+j,cellsize*fy[i]+j,cellsize-2*j,cellsize-2*j);
			}

			/* render value */
			if (fv[i]<0) {
				p.fill(p.color(255,0,0,alpha));
				p.text(-fv[i], cellsize*fx[i]+2, cellsize*(fy[i]+1)-3); /* render value */
			}
			else {
				p.fill(p.color(255,255,255,alpha));
				p.text(fv[i], cellsize*fx[i]+2, cellsize*(fy[i]+1)-3); /* render value */
			}
			p.noFill();

		}
		
		moveSnake();
		checkDeath();
		checkCollideFood();
		removeOldFood();

		/* spawn new food every sec at 1/3 chance when not in classic mode*/
		if (!classicmode)
			if(p.frameCount % 10 == 0)
				if(p.int(p.random(0,2))==0)
					spawnFood();
	};

	/* Change snake direction */
	p.keyPressed = function() {
		if (!movementlock)
			if(p.keyCode==p.DOWN && dy!=-1) {
				dx=0;
				dy=1;
			} else if (p.keyCode==p.UP && dy!=1) {
				dx=0;
				dy=-1;
			} else if (p.keyCode==p.LEFT && dx!=1) {
				dx=-1;
				dy=0;
			} else if (p.keyCode==p.RIGHT && dx!=-1) {
				dx=1;
				dy=0;
			} else if (p.key == 112)
				pause = !pause;
			else if (p.keyCode == p.ESC) {
				gameover=true;
			}

		if (gameover && (p.keyCode==p.ENTER || p.keyCode==p.RETURN || p.key==32 || p.keyCode==p.ESC)) {
			p.exit();
			$("#game").css("display","none");
			$("#menu").css("display","inline");
			$("#lastscore").css("display","inline");
			$("#lscore").html(score);

		}

		movementlock=true;
	};

}
