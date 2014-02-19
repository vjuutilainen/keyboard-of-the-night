;(function (exports){

	var createModes = function(){

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

		var intervals = [2,2,2,1,2,2,2,1];

		for(key in modes){
			
		// shift array by one
		var first = intervals.slice(0,modeShift);
		var last = intervals.slice(modeShift,intervals.length);
		
		modes[key] = last.concat(first);

		modeShift += 1;
	};

	return modes;

}


// Create note data for a given semitone range with a base of 440
// Number, Number -> notes object

var createNoteRange = function(lowest,highest){
	var baseNoteNum = 49 + lowest;
	var noteIndex = 9+lowest;
	var range = {length: highest-lowest, notes: {} };

	for(var i = lowest; i <= highest; i++){

		var noteNum =  baseNoteNum + (i-lowest);
		var octave = octaveFromNoteNumber(noteNum);
		var noteLetter = NOTES[(i-lowest)%NOTES.length];
		var noteString = NOTES[(i-lowest)%NOTES.length]+octave;
		var noteFreq = createFreq(i);
		range.notes[noteNum] = { num: noteNum, string: noteString, note: noteLetter, freq: noteFreq}; 
	}

	return range;
}

var octaveFromNoteNumber = function(n){
	return Math.floor((n-4)/12)+1;
}

// semitones from 440 base -> frequency

var createFreq = function(steps){
	return 440 * Math.pow(Math.pow(2,1/12),steps);
}

// Synthbox constructor, methods for playing and pausing notes
// Notes object -> Synthbox object

var SynthBox = function(noterange) {

// add synths based on data as objects

for(key in noterange.notes){

	var objName = noterange.notes[key].num;
	this[objName] = {

		frequency: noterange.notes[key].freq,
		note: noterange.notes[key].note,
		string: noterange.notes[key].string,
		number: noterange.notes[key].num,
		sound: audio.createOscillator(),
		gain: audio.createGainNode()

	}
	
	// define frequency
	this[objName].sound.frequency.value = this[objName].frequency;
	
	// Oscillator -> GainNode
	this[objName].sound.connect(this[objName].gain);
	
	// GainNode -> Destination
	this[objName].gain.connect(audio.destination);

	// Play in silence
	this[objName].gain.gain.value = 0;
	this[objName].sound.start();

}

};

SynthBox.prototype = {

	play: function(playnote){
		this[playnote].gain.gain.value = 1;
		
	},

	pause: function(playnote){
		this[playnote].gain.gain.value = 0;
	}

}

// Takes a scale note array, mode as string and notestring,
// returns an array of note numbers

var createMelodyFromPattern = function(pattern,mode,notestring) {
	var melody = [];
	var baseNumber = noteStringToNoteNumber(notestring);

	for(var n = 0; n < pattern.length; n++){

		var intervalSum = baseNumber;

		

		for(var i = 1; i < pattern[n]; i++){

			
			intervalSum += mode[i];
		}
		
		melody.push(intervalSum);

	}

	return melody;
}


var noteStringToNoteNumber = function(notestring){
	for(key in noterange.notes){
		if(noterange.notes[key].string === notestring){
			return noterange.notes[key].num; 
		}

	}
	
	return -1;
	
}



// handle time, calculate beats and measures
// Array -> 

var startTick = function(melody){

	playing = true;
	var frame = 0;
	var beat = 0;
	var measure = 0;
	var tempomodifier = (60/tempo) * 60;
	prepareVis(melody);

	var tick = function(){

		drawScreen();

		if(playing){
			frame += 1;
	// if it's time for a new beat
	if(Math.floor(frame/tempomodifier) !== beat){

		beat += 1;
		measure = Math.floor(beat/rhythm) === measure ? measure : measure +1;
		
		playMelodyOnBeat(beat,melody);
	}
	
}

setTimeout(function() {
	requestAnimationFrame(tick);
}, 1000 / fps);
}

requestAnimationFrame(tick);
}

var screenShapes = {



};

// playnote string -> object

var Shape = function(playnote){

	this.x = (mySynthBox[playnote].number-14)*(width/noterange.length);
	this.y = height/2;

	this.width = width/noterange.length;
	this.height = height/4;
	this.opacity = 0;

}

Shape.prototype = {

	update: function(){
		this.opacity = this.opacity < 0.05 ? 0 : this.opacity - 0.05;


	},

	draw: function(){


		c.beginPath();
		c.rect(this.x,this.y,this.width,this.height);
		c.fillStyle = 'rgba(255,255,255,'+this.opacity+')';
		c.fill();
		c.closePath();


	}

}

var prepareVis = function(melody){

	for(var i = 0; i < melody.length; i++){
		if(melody[i] !== ''){
			screenShapes[melody[i]] = new Shape(melody[i]);
		}
	}

}

var drawScreen = function(){

	c.clearRect(0,0,width,height);

	for(var obj in screenShapes){

		screenShapes[obj].update();
		screenShapes[obj].draw();

	}

		//keyboard.draw();

		personality.update();
		personality.draw();


	}


//
// Natural, Array -> 

var playMelodyOnBeat = function(beat,melody){

	switch(melody[beat-1]) {

	// If no more notes to play
	case undefined:
	//console.log("Stopping the play");
	playing = false;
	break;

	// If there's a rest
	case '':
	//console.log("Rest");
	break;

	// Otherwise playing the note
	default:
	var playnote = melody[beat-1];

	mySynthBox.play(playnote);

	screenShapes[playnote].opacity = 1;
	
	//console.log("Playing " + playnote);

	setTimeout(function(){
		
		mySynthBox.pause(playnote);
		screenShapes[playnote].visible = false;
	}, notelength);

}

}


// initialize canvas

var setCanvas = function(canvasId,width,height){

	canvas = document.getElementById(canvasId);
	canvas.width = width;
	canvas.height = height;
	c = canvas.getContext("2d");

}

var Personality = function(){

	this.opacity = 0.5;
	this.x = width/2-100;
	this.x2 = width/2+100;
	this.y = 100;
	this.r = 50;
	this.delta = 0.01;

}

var Keyboard = function(){

	this.padding = 20;
	this.x = width/noterange.length;
	this.y = height/2;
	this.w = width/noterange.length;
	this.h = height/4;
}

Keyboard.prototype = {

	draw: function(){

		for(var i = 0; i < noterange.length; i++){
			
			c.beginPath();
			c.rect(this.x*i,this.y,this.w,this.h);
			c.strokeStyle = 'rgba(255,255,255,1)';
			c.stroke();
			c.closePath();

		}

	}
}

Personality.prototype = {

	draw: function(){

		c.fillStyle = 'rgba(255,255,255,'+this.opacity+')';

		c.beginPath();

		c.arc(this.x, this.y, this.r, 0, 1 * Math.PI, false);

		c.closePath();

		c.fill();

		c.beginPath();
		c.arc(this.x2, this.y, this.r, 0, 1 * Math.PI, false);
		c.closePath();

		c.fill();

	},

	update: function(){	
		
		this.delta = this.opacity > 0.7 ? -0.003 : this.opacity < 0.3 ? 0.003 : this.delta;
		this.opacity = this.opacity + this.delta;
	}


};

var createRandomProgression = function(length){
	var progression = [];
	
	for(var i = 0; i < length; i++){
		progression = progression.concat(arpeggios[Math.floor(Math.random()*4)]);
	}
	
	return progression;
};

var NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

var width = window.innerWidth;
var height = window.innerHeight;
var playing = false;

var modes = createModes();
var noterange = createNoteRange(-35,48);

var fps = 60;
var beat = 0;
var rhythm = 4;
var tempo = 220;
var notelength = 60000/tempo/2;

var audio = new window.webkitAudioContext();

var personality = new Personality();
var keyboard = new Keyboard();

var mySynthBox = new SynthBox(noterange);

var arpeggios = [

createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['ionian'], 'C4'),
createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['dorian'], 'D4'),
createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['phrygian'], 'E4'),
createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['lydian'], 'F4'),
createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['mixolydian'], 'G4'),
createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['aeolian'], 'A4'),
createMelodyFromPattern([1,3,5,3,1,3,5,3], modes['locrian'], 'B4')

];

window.onload = function(){

	setCanvas("myCanvas",width,height);
	var melody = createRandomProgression(8);
	startTick(melody);
	
}


})(this);


