;(function (exports){

	var Keyboard = function(c){

		this.width = c.canvas.clientWidth;
		this.height = c.canvas.clientHeight;

		this.canvas = c.canvas;

		this.notes = this.createNotes();
		
		this.c = c;

		this.display = new Display(this);
		this.synth = new Synth(this);
		this.personality = new Personality(this);
		this.input = new Input(this);
		this.player = new Player(this);

	};


	Keyboard.prototype = {

		update: function(){

			this.input.update();
			this.personality.update();
			this.display.update();
			this.render();

		},

		render: function(){

			this.c.clearRect(0,0,this.width,this.height);
			this.display.draw(this.c);
			this.personality.draw(this.c);
			

		},

	// Create note objects containing frequency and note name
	createNotes: function(){

		var lowest = 1;
		var highest = 89;
		var notes = {};
		var NOTELETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

		var createFreq = function(steps){
			return 440 * Math.pow(Math.pow(2,1/12),steps);
		};

		for(var i = lowest; i < highest; i++){
			notes[i] = {frequency: createFreq(i-49),
						letter: NOTELETTERS[(i+8)%12],
						octave: Math.floor((i+8)/12) };
		}

		return notes;
	
	},

	playKey: function(notenumber,time){

		var _this = this;
		this.synth.playNote(notenumber,time);
		
		setTimeout(function(){
			_this.display.lightKey(notenumber);
		},time*1000);

	},	

	playMelody: function(melody){

		this.player.play(melody);
		this.personality.setMood(melody);

	}


};

var handleMouseClick = function(mouseEvent,keyboard){

	var x = mouseEvent.pageX;
	var y = mouseEvent.pageY;

	var clickCheck = function(mouseEvent){

		var result = false;
		
		keyboard.display.keys.forEach(function(key){
			
			if((x > key.x && x < key.x+key.width) &&
			   (y > key.y && y < key.y+key.height)){
			   	
				result = key.notenumber;
			}

		});

		return result;

	}

	var clickResult = clickCheck(mouseEvent);

	if(clickResult !== false){
		keyboard.playKey(clickResult,0);
	};

};

var Input = function(keyboard){
	
	this.keyboard = keyboard;
	keyboard.canvas.addEventListener('mousedown',function(mouseEvent){
		handleMouseClick(mouseEvent,keyboard)
	});
};

Input.prototype = {

	update: function(){


	}


}


// Synth constructor

var Synth = function(keyboard) {

	this.keyboard = keyboard;
	this.audio = new window.webkitAudioContext();
	this.noteLength = 0.5;
	this.noteAttack = 0.1;
	this.noteDecay = 0.1;
	this.noteVolume = 1;

};

Synth.prototype = {

	playNote: function(notenumber,time){

		var now = time + this.audio.currentTime;

		this.sound = this.audio.createOscillator();

		// GainNode -> Destination
		this.gainNode = this.audio.createGainNode();
		this.gainNode.connect(this.audio.destination);
		
		// Oscillator -> GainNode
		this.sound.connect(this.gainNode);
		this.sound.frequency.value = this.keyboard.notes[notenumber].frequency;

		// Fade in
		this.gainNode.gain.linearRampToValueAtTime(0, now);
		this.gainNode.gain.linearRampToValueAtTime(this.noteVolume, now + this.noteAttack);

		// Fade out
		this.gainNode.gain.linearRampToValueAtTime(this.noteVolume, now + this.notelength - this.noteDecay);
		this.gainNode.gain.linearRampToValueAtTime(0, now + this.noteLength);

		this.sound.start(now);

		this.sound.stop(now + 0.5);
		
	},

	pause: function(notenumber){
		
	}

}

var Player = function(keyboard){

	this.keyboard = keyboard;
	this.tempo = 120;
	this.beatLength = 60 / this.tempo;
}

Player.prototype = {

	play: function(melody){
		
		var _this = this;
		this.tempo = melody.tempo ? melody.tempo : this.tempo;
		this.beatLength = 60 / this.tempo;

		melody.notes.forEach(function(noteElement, index){
			
			if(typeof noteElement === 'object'){
				noteElement.forEach(function(subNoteElement, subindex){
					if(typeof subNoteElement === 'number'){
					_this.keyboard.playKey(subNoteElement,subindex*_this.beatLength);
				}
				});
			}

			if(typeof noteElement === 'number'){
				_this.keyboard.playKey(noteElement,index*_this.beatLength);
			}

		});
		
	}

};

var Personality = function(keyboard){

	this.keyboard = keyboard;
	this.opacity = 0.5;
	this.x = keyboard.width/2-100;
	this.x2 = keyboard.width/2+100;
	this.y = 60;
	this.r = 50;
	this.delta = 0.01;
	this.rotation = 0;
	this.rotationTarget = 0;
	

}

Personality.prototype = {

	draw: function(c){

		c.save();
		c.fillStyle = 'rgba(255,255,255,'+this.opacity+')';
		c.beginPath();
		c.translate(this.x,this.y);
		c.rotate(this.rotation*Math.PI/180);
		c.translate(-this.x,-this.y);
		c.arc(this.x, this.y, this.r, 0, 1 * Math.PI, false);
		c.closePath();
		c.fill();
		c.restore();

		c.save();
		c.fillStyle = 'rgba(255,255,255,'+this.opacity+')';
		c.beginPath();
		c.translate(this.x2,this.y);
		c.rotate(-this.rotation*Math.PI/180);
		c.translate(-this.x2,-this.y);
		c.arc(this.x2, this.y, this.r, 0, 1 * Math.PI, false);
		c.closePath();
		c.fill();
		c.restore();

	},

	update: function(){	
		
		this.delta = this.opacity > 0.6 ? -0.003 : this.opacity < 0.3 ? 0.003 : this.delta;
		this.opacity = this.opacity + this.delta;
		this.rotation = this.rotation > this.rotationTarget ? this.rotation - 0.05 : this.rotation < this.rotationTarget ? this.rotation + 0.05 : this.rotation;

	},

	setMood: function(melody){

		if(melody.mode === 'locrian'){
			this.rotationTarget = 10;
		}
		if(melody.mode === 'aeolian'){
			this.rotationTarget = -10;
		}
		if(melody.mode === 'dorian' || melody.mode === 'phrygian' || melody.mode === 'lydian'){
			this.rotationTarget = -5;
		}
		if(melody.mode === 'ionian' || melody.mode === 'mixolydian'){
			this.rotationTarget = 0;
		}

	}


};

var Display = function(keyboard){

	this.keyboard = keyboard;
	this.paddingTop = 200;
	this.x = 0;
	this.y = this.paddingTop;
	this.width = keyboard.width;
	this.height = keyboard.height-this.paddingTop;
	this.keywidth = this.width/12;
	this.keyheight = this.height/9;
	this.keys = [];
	for(var i = 0; i < Object.keys(this.keyboard.notes).length; i++){
		this.keys.push(new Key(this.keyboard.notes[i+1], i, this));
	}

}

Display.prototype = {

	update: function(){

		this.keys.forEach(function(key){
		
			key.lightness = key.lightness > 0.03 ? key.lightness - 0.03 : key.lightness <= 0.03 ? 0 : key.lightness;	

		});

	},

	lightKey: function(notenumber){

		this.keys[notenumber-1].lightness = 1;
	},

	draw: function(c){

		this.keys.forEach(function(key){
			key.draw(c);
		});

	}

}

var Key = function(note,index,display){

	this.display = display;
	this.width = display.keywidth;
	this.height = display.keyheight;
	this.lightness = 0;
	this.index = index;
	this.notenumber = index+1;
	this.note = note;
	this.x = this.width*((this.index+9)%12);
	this.y = this.display.keyboard.height-this.height-(this.height*Math.floor((this.index+9)/12));

}

Key.prototype = {

	update: function(){
		

	},

	draw: function(c){

		c.beginPath();
		c.rect(this.x,this.y,this.width,this.height);
		c.fillStyle = 'rgba(255,255,255,'+this.lightness+')';
		c.strokeStyle = 'black';
		c.stroke();
		c.fill();
		c.closePath();

		// c.beginPath();
		// c.fillStyle = '#666';
		// c.font = '10px Helvetica';
		// c.fillText(this.note.letter+this.note.octave,(this.width/2)+this.x,(this.height/2)+this.y);
		// c.fill();
		// c.closePath();

	}

}


// Composer constructor

var Composer = function(){

	this.NOTELETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
	this.modePatterns = this.createModePatterns();

	// compose only with certain notes, 88 is highest note number, lowest 1
	this.lowLimit  = 40; // C4
	this.highLimit = 88; // C8
	this.noterange = this.highLimit-this.lowLimit;
	this.tempo = 500;

}

Composer.prototype = {

	getRandomMode: function(){
		return Object.keys(this.modePatterns)[Math.floor(Math.random()*Object.keys(this.modePatterns).length)];
	},

	getRandomKey: function(){
		return this.NOTELETTERS[Math.floor(Math.random()*this.NOTELETTERS.length)];
	},

	createRandomMelody: function(length){

	var melody = [];

	for(var i = 0; i < length; i++){
		melody.push(Math.round(Math.random()*this.noterange) + this.lowLimit);
	}
	
	return {notes: melody,
			tempo: this.tempo};
	},

	createRandomModeMelody: function(mode, key, length){

		var _this = this;
		var modeMelody = [];

		var getModeNoteNumbers = function(modeletters){

			var numbers = [];

			for(var i = _this.lowLimit; i <= _this.highLimit; i++){		
				modeletters.forEach(function(letter){
					if(_this.NOTELETTERS[(i+8)%12] === letter){
						numbers.push(i);
					}
				});
			}

			return numbers;
		};

		var getModeScaleLetters = function(mode,key){

			var modePattern = _this.modePatterns[mode];
			var scaleLetters = [];
			var letterIndex = _this.NOTELETTERS.indexOf(key);
			var intervalSum = 0;

			modePattern.forEach(function(interval,index){
				intervalSum += interval;				
				scaleLetters.push(_this.NOTELETTERS[(letterIndex+intervalSum)%12]);
			});	

			return scaleLetters;
		};

		var modeScaleLetters = getModeScaleLetters(mode,key);
		

		var modeNumbers = getModeNoteNumbers(modeScaleLetters);
	

		for(var i = 0; i < length; i++){
			modeMelody.push(modeNumbers[Math.floor(Math.random()*modeNumbers.length)]);
		};

		return {notes: modeMelody,
				tempo: this.tempo};
	},

	// Returns interval patterns for seven modes in an object

		createModePatterns: function(){

		var modeShift = 0;
		var modes = {
			ionian: [],
			dorian: [],
			phrygian: [],
			lydian: [],
			mixolydian: [],
			aeolian: [],
			locrian: []
		}

		var intervals = [2,2,1,2,2,2,1];

		for(key in modes){		
			var first = intervals.slice(0,modeShift);
			var last = intervals.slice(modeShift,intervals.length);
			modes[key] = last.concat(first);
			modeShift += 1;
		};

	return modes;

	},

	createCanonMelody: function(mode,key,length,depth,shift){

	var melody = this.createRandomModeMelody(mode,key,length);
	var depth = depth;
	var canon = [];
	
	for(var d = 0; d < depth; d++){

		var thisMelody = melody.notes.slice();

			for(var s = 0; s < melody.notes.length+(shift*(depth-1)); s++){
				if(s < shift*d){
					thisMelody[s] = '';
				}
				else if(s > (shift*d) + melody.notes.length-1){
					thisMelody[s] = '';
				}
				else {
					thisMelody[s] = melody.notes[s-(d*shift)];
		}

		}
		
		canon.push(thisMelody);		
	}

	return {notes: canon,
				tempo: this.tempo,
				mode: mode};

}

}

// The world

var bigBang = function(object){

	var fps = 60;

	var loop = function(){

		object.update();
		
		setTimeout(function() {
			requestAnimationFrame(loop);
		}, 1000 / fps);
	}

	requestAnimationFrame(loop);

}

// initialize canvas

var getCanvas = function(canvasId,width,height){

	var canvas = document.getElementById(canvasId);
	canvas.width = width;
	canvas.height = height;
	return canvas.getContext("2d");

}

window.onload = function(){

	var width = window.innerWidth;
	var height = window.innerHeight;

	var c = getCanvas("myCanvas",width,height);

	var keyboard = new Keyboard(c);
	var composer = new Composer();

	bigBang(keyboard);

	var playLoop = function(){
		
		composer.tempo = 160;
		var mode = composer.getRandomMode();
		var key = composer.getRandomKey();
		var melody = composer.createCanonMelody(mode,key,16,3,3);
		keyboard.playMelody(melody);

		var wait = (60 / composer.tempo * melody.notes[0].length * 1000) + 5000;
		
		setTimeout(function(){
			playLoop();
		},wait);
	}
	
	playLoop();
}

})(this);
