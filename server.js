// Dependencies

var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");
var axios = require("axios");

// Mongoose

var Note = require("./models/Note");
var Article = require("./models/Article");

// Require all models
// var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// app set-ups

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrape-news-db";

mongoose.connect(MONGODB_URI);

app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");



// Routes

app.get("/", function(req, res) {
	Article.find({}, null, {sort: {created: -1}}, function(err, data) {
		if (data.length === 0) {
			res.render("placeholder", {message: "There's nothing scraped yet. Please click \"Scrape For Newest Articles\""});
		}
		else {
			res.render("index", {articles: data});
			console.log("data data: " + data)
		}
	});
});

app.get("/scrape", function(req, res) {

	axios.get("https://www.cnbc.com/investing/").then(function(response) {
		
		var $ = cheerio.load(response.data);

		$(".headline").each(function(i, element) {

			var result = {};

			var link = "https://www.cnbc.com" + $(element).children("a").attr("href");
			var title = $(element).children("a").text().trim();
			var summary = $(element).nextAll(".desc").text().trim();

			result.link = link;
			result.title = title;
			result.summary = summary;

			console.log(result);

			var entry = new Article(result);

			Article.find({title: result.title}, function(err, data) {
				if (data.length === 0) {
					entry.save(function(err, data) {
						if (err) throw err;
					});
				}
			});
		});
		console.log("Scrape finished.");
		res.redirect("/");
	});
});

app.get("/saved", function(req, res) {
	Article.find({issaved: true}, null, {sort: {created: -1}}, function(err, data) {
		if(data.length === 0) {
			res.render("placeholder", {message: "You have not saved any articles yet. Try to save some delicious news by simply clicking \"Save Article\"!"});
		}
		else {
			res.render("saved", {saved: data});
		}
	});
});

app.get("/:id", function(req, res) {
	Article.findById(req.params.id, function(err, data) {
		res.json(data);
	})
})

app.post("/search", function(req, res) {
	console.log(req.body.search);
	Article.find({$text: {$search: req.body.search, $caseSensitive: false}}, null, {sort: {created: -1}}, function(err, data) {
		console.log(data);
		if (data.length === 0) {
			res.render("placeholder", {message: "Nothing has been found. Please try other keywords."});
		}
		else {
			res.render("search", {search: data})
		}
	})
});

app.post("/save/:id", function(req, res) {
	Article.findById(req.params.id, function(err, data) {
		if (data.issaved) {
			Article.findByIdAndUpdate(req.params.id, {$set: {issaved: false, status: "Save Article"}}, {new: true}, function(err, data) {
				res.redirect("/");
			});
		}
		else {
			Article.findByIdAndUpdate(req.params.id, {$set: {issaved: true, status: "Saved"}}, {new: true}, function(err, data) {
				res.redirect("/saved");
			});
		}
	});
});

app.post("/note/:id", function(req, res) {
	var note = new Note(req.body);
	note.save(function(err, doc) {
		if (err) throw err;
		Article.findByIdAndUpdate(req.params.id, {$set: {"note": doc._id}}, {new: true}, function(err, newdoc) {
			if (err) throw err;
			else {
				res.send(newdoc);
			}
		});
	});
});

app.get("/note/:id", function(req, res) {
	var id = req.params.id;
	Article.findById(id).populate("note").exec(function(err, data) {
		res.send(data.note);
	})
})


// Start the server
app.listen(PORT, function() {
	console.log("App running on port " + PORT + "!");
  });