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

	snd.setVolume(.5);
}

function draw() {
	background(220);

	/* Visualize frequency spectrum using horizontal rectangular bars. */
	let fspec = fft.analyze();
	let colw = width / 32;  // NOTE: 32 is the fft size
	for (let i = 0; i < fspec.length; ++i) {
		let y = map(fspec[i], 0, 255, height, height / 4);
		rect(i * colw, y, colw, height);
		text(i + 1,  // don't start at 0
			i * colw,  // draw above the rectangles
			y - 5);    // add some padding
	}

	/* Visualize amplitude using a circle centered in the canvas. */
	let scaling = 500;
	let vol = amp.getLevel() * scaling;
	let centerxy = [width / 2, height / 2];
	ellipse(centerxy[0], centerxy[1], vol, vol);
	text(vol, centerxy[0], centerxy[1]);
	text("(Upscaled by: " + scaling + ")", centerxy[0], centerxy[1] + 10);
}
