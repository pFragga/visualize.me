"use strict"

let amp;
let snd;
let fft;
let toggleBtn;
let input;

/***************************
 * Custom/helper functions *
 ***************************/

function uploadAudioFile(f) {  // FIXME
	if (f.type !== "audio") {
		console.log(`Error loading '${f.name}': is not an audio file.`);
		return;
	}
	snd.stop();
	snd = loadSound(f.name);
}

function getDebugInfo() {
	console.log("Freq specturm:\t", fft.analyze(),
		"\nWaveform:\t", fft.waveform(),
		"\nAmp level:\t", amp.getLevel()
	);
}

/*****************************
 * Overriden p5.js functions *
 *****************************/

function preload() {
	snd = loadSound("assets/songs/level-vii-short-258782.mp3");
}

function setup() {
	createCanvas(800, 600);

	toggleBtn = createButton("Play/Pause");
	toggleBtn.position(0, 0);
	toggleBtn.mousePressed(() => {
		snd.isPlaying() ? snd.pause() : snd.play();
	});

	// input = createFileInput(uploadAudioFile);
	// input.position(0, toggleBtn.height);

	amp = new p5.Amplitude();
	amp.setInput(snd);

	fft = new p5.FFT(.8, 32);  // TODO: don't hardcode smoothing and size
	fft.setInput(snd);
}

function draw() {
	background(220);
}
