"use strict"
const express = require("express");
const app = express();
const port = 6969;

// Set up Multer and configure to store uploaded stuff in ./public/assets/uploads
const multer = require("multer");
const diskStorage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, "public/assets/uploads");
	},
	filename: (req, file, callback) => {
		// Took this from: https://www.npmjs.com/package/multer#diskstorage
		let prefix = Date.now() + "_" + Math.round(Math.random() * 1e9);
		callback(null, `${prefix}-${file.originalname}`);
	}
});
const upload = multer({ storage: diskStorage });

// Middleware:
// 1. Serve static content from ./public (use it as content root aka /)
// 2. Enable parsing for json and url-encoded content (because why not?)
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Endpoint for uploading audio/song files
app.post("/uploads", upload.single("custom_audio"), (req, res, next) => {
	if (!req.file)
		return res.status(400).send(JSON.stringify({ msg: "No file uploaded!" }));

	// NOTE: More sanity checks wouldn't hurt here...

	console.log(req.file, "\n", req.body);

	res.status(200).send(JSON.stringify({
		msg: "Uploaded file successfully!",
		filename: req.file.filename
	}));
});

// Start listening for connections
app.listen(port, () => {
	let date = new Date();
	console.log(`${date.toLocaleString()}>\tServing on port ${port}...`);
});
