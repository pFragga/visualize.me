"use strict"

// Sound files the server already knows about
const sndFiles = [
	"extraordinary-idea-medium-258779.mp3",
	"cool-driver-254248.mp3",
	"level-vii-short-258782.mp3",
	"music-for-arcade-style-game-146875.mp3"
];
const fftSmooth = .6;    // Smoothing applied to frequency specturm
const fftSz     = 1024;  // "bins": The length of resulting array
const __debug__ = false;
let amp;
let snd;
let fft;
let cycleVisBtn;
let currVis;
let fileInput;
let sndSelect;
let colR;
let colG;
let colB;

/***************************
 * Custom/helper functions *
 ***************************/

/*
 * Used to determine what color fill/stroke/etc should use, provided the call
 * to those functions use the variables colR, colG, colB.
 *
 * To get that rainbow effect, we have to go back and forth on the entire color
 * spectrum.  So we need 3 distinct periodic functions and map their values into
 * [0, 255].
 */
function colorMyPencils() {
	let x = frameCount * .01;  // Downscale
	colR = map(sin(x), -1, 1, 0, 255);
	colG = map(cos(x), -1, 1, 0, 255);
	colB = map(sin(x + 10), -1, 1, 0, 255); // sin, but shifted to the left
}

/*
 * Draw an indicator at the top of the canvas displaying the "mode" we're in
 * (similar to Vim's showmode).
 */
function drawIndicator() {
	let desc;
	switch (currVis) {
	case 1:
		desc = "Frequency spectrum";
		break;
	case 2:
		desc = "Amplitude";
		break;
	default:
		desc = "Waveform";
		break;
	}
	text("-- " + desc + " --", width / 2, 30);
}

/*
 * Stop the currenly playing audio and load a new one at the provided path.
 */
async function reloadSnd(path) {
	if (snd.isPlaying())
		snd.stop();

	// This is so fucking broken, but at least it works!!
	snd = loadSound(path, () => {
		alert("Reloaded audio!");
		amp.setInput(snd);
		fft.setInput(snd);
	});
}

async function submitForm(file) {
	if (file.type !== "audio") {
		alert("Wrong file type: must choose an audio file!");
		console.error("Wrong file type: must choose an audio file!");
		return;
	}

	let formData = new FormData();
	formData.append("custom_audio", file.file);  // LMFAO

	// Send the formData in a POST request to multer at /uploads
	await fetch("/uploads", {
		method: "POST",
		body: formData
	})
	.then(async (res) => {
		let resData = await res.json();
		if (res.ok) {
			console.log(resData.msg);

			// Immediately try to change the audio that's currently playing
			reloadSnd("assets/uploads/" + resData.filename)
		} else {
			console.error(resData.msg);
		}
	});
}

/*****************************
 * Overriden p5.js functions *
 *****************************/

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	cycleVisBtn.position(width - cycleVisBtn.width, 0);
	sndSelect.position(0, 0);
	fileInput.position(0, sndSelect.height);
}

function preload() {
	snd = loadSound("assets/songs/" + sndFiles[0]);
}

function setup() {
	let cnv = createCanvas(windowWidth, windowHeight);
	cnv.mousePressed(() => {
		snd.isPlaying() ? snd.pause() : snd.play();
	});


	cycleVisBtn = createButton("Cycle Visualizer");
	cycleVisBtn.position(width - cycleVisBtn.width, 0);
	cycleVisBtn.mousePressed(() => {
		currVis = ++currVis % 3;  // Modulo the number of methods we have
		// console.log("Current visualizer:\t" + currVis);
	});
	currVis = 0;

	sndSelect = createSelect();
	sndSelect.position(0, 0);
	sndSelect.changed(() => {
		reloadSnd("assets/songs/" + sndSelect.value());
	});

	// Add each known sound file as an option 
	for (let sndFile of sndFiles)
		sndSelect.option(sndFile);

	amp = new p5.Amplitude();
	amp.setInput(snd);
	amp.toggleNormalize();

	fft = new p5.FFT(fftSmooth, fftSz);
	fft.setInput(snd);

	snd.setVolume(.5);

	// Create the form elements for uploading audio files
	let form = createDiv();
	fileInput = createFileInput(submitForm);
	fileInput.attribute("name", "custom_audio");

	form.child(fileInput);

	// Set the form attributes
	form.attribute("action", "/uploads");
	form.attribute("method", "post");
	form.attribute("enctype", "multipart/form-data");

	fileInput.position(0, sndSelect.height);

	colorMyPencils();  // Initialize RGB color variables
}

function draw() {
	background(220);

	// Draw the indicator responsively based on the canvas' width
	if (width > 800) {
		fill(255);
		textAlign(CENTER);
		textFont("monospace");
		stroke(0);

		if (width < 1200)
			textSize(18);
		else
			textSize(24);

		drawIndicator();
	}

	// Update colors, gives rainbow effect over time
	if (snd.isPlaying())
		colorMyPencils();

	switch (currVis) {
	case 1:
		/* Visualize frequency spectrum using horizontal rectangular bars. */
		let fspec = fft.analyze();
		let colw = width / fftSz;
		for (let i = 0; i < fspec.length; ++i) {
			let y = map(fspec[i], 0, 255, height, height / 4);
			stroke(colR, colG, colB);
			line(i * colw, height, i * colw, y);
		}
		break;

	case 2:
		/* Visualize amplitude using a circle centered in the canvas. */
		let scaling = 500;
		let vol = map(amp.getLevel(), 0, 1, 0, scaling);
		fill(colR, colG, colB);
		ellipse(width / 2, height / 2, vol, vol);
		if (__debug__)
			text(vol + "\n[x" + scaling + "]", width / 2, height / 2);

		break;

	default:
		/* Linear interpolation on sample values. */
		let wav = fft.waveform();
		stroke(colR, colG, colB);
		strokeWeight(3);
		noFill();  // Don't fill the area under the curve
		beginShape();
		for (let i = 0; i < width; ++i) {
			let idx = floor(map(i, 0, width, 0, wav.length));
			curveVertex(i, wav[idx] * 300 + height / 2);
		}
		endShape();
		strokeWeight(1);
		break;
	}
}
