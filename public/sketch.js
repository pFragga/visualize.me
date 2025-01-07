"use strict"

// Sound files the server already knows about
const sndFiles = [
	"extraordinary-idea-medium-258779.mp3",
	"cool-driver-254248.mp3",
	"level-vii-short-258782.mp3",
	"music-for-arcade-style-game-146875.mp3"
];
const fftSmooth = .8;  // Smoothing applied to frequency specturm
const fftSz     = 32;  // "bins": The length of resulting array
let __debug__;
let amp;
let snd;
let fft;
let toggleDbgBtn;
let cycleVisBtn;
let currVis;
let fileInput;
let sndSelect;

/***************************
 * Custom/helper functions *
 ***************************/

function getDebugInfo() {
	console.log("Freq specturm:\t", fft.analyze(),
		"\nWaveform:\t", fft.waveform(),
		"\nAmp level:\t", amp.getLevel()
	);
}

async function reloadSnd(assetDir, filename) {
	if (snd.isPlaying())
		snd.stop();

	// FIXME: Correct assetDir if trailing "/" is missing

	// This is so fucking broken, but at least it works!!
	snd = loadSound(assetDir + filename, () => {
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
			reloadSnd("assets/uploads/", resData.filename)
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
	toggleDbgBtn.position(0, 0);
	cycleVisBtn.position(width - cycleVisBtn.width, 0);
	fileInput.position(toggleDbgBtn.width, 0);
	sndSelect.position(0, toggleDbgBtn.height);
}

function preload() {
	snd = loadSound("assets/songs/" + sndFiles[0]);
}

function setup() {
	let cnv = createCanvas(windowWidth, windowHeight);
	cnv.mousePressed(() => {
		snd.isPlaying() ? snd.pause() : snd.play();
	});

	toggleDbgBtn = createButton("Toggle debug");
	toggleDbgBtn.position(0, 0);
	toggleDbgBtn.mousePressed(() => {
		__debug__ = !__debug__;
		// console.log("Debug mode: ", __debug__ ? 1 : 0);
	});
	__debug__ = true;  // NOTE: Turn this off in release version

	cycleVisBtn = createButton("Cycle Visualizer");
	cycleVisBtn.position(width - cycleVisBtn.width, 0);
	cycleVisBtn.mousePressed(() => {
		currVis = ++currVis % 3;  // Modulo the number of methods we have
		// console.log("Current visualizer:\t" + currVis);
	});
	currVis = 0;

	sndSelect = createSelect();
	sndSelect.position(0, toggleDbgBtn.height);
	sndSelect.changed(() => {
		reloadSnd("assets/songs/", sndSelect.value());
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

	fileInput.position(toggleDbgBtn.width, 0);
}

function draw() {
	background(220);

	// TODO: Display WHAT we are visualizing each time

	switch (currVis) {
	case 1:
		/* Visualize frequency spectrum using horizontal rectangular bars. */
		let fspec = fft.analyze();
		let colw = width / fftSz;
		for (let i = 0; i < fspec.length; ++i) {
			let y = map(fspec[i], 0, 255, height, height / 4);
			rect(i * colw, y, colw, height);
			if (__debug__) {
				text(i + 1,	// don't start at 0
					i * colw,	// draw above the rectangles
					y - 5);		// add some padding
			}
		}
		break;

	case 2:
		/* Visualize amplitude using a circle centered in the canvas. */
		let scaling = 500;
		let vol = map(amp.getLevel(), 0, 1, 0, scaling);
		let centerxy = [width / 2, height / 2];
		ellipse(centerxy[0], centerxy[1], vol, vol);
		if (__debug__)
			text(vol + "\n[x" + scaling + "]", centerxy[0], centerxy[1]);
		break;

	default:
		/* Linear interpolation on sample values. */
		let wav = fft.waveform();
		strokeWeight(3);
		noFill();  // Don't fill the area under the curve
		beginShape();
		for (let i = 0; i < wav.length; ++i){
			let x = map(i, 0, wav.length, 0, width);
			let y = map(wav[i], -1, 1, 0, height);
			curveVertex(x, y);
		}
		endShape();
		fill(255, 255);  // FIXME: This messes up text in debug mode
		strokeWeight(1);
		break;
	}
}
