"use strict"
const express = require("express");
const app = express();
const port = 6969;

// Middleware:
// 1. Serve static content from ./public (use it as content root aka /)
// 2. Enable parsing for json and url-encoded content (because why not?)
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Start listening for connections
app.listen(port, () => {
	let date = new Date();
	console.log(`${date.toLocaleTimeString("el-gr")}>\tServing on port ${port}...`);
});
