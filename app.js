const express = require("express");
const app = express();
let ejs = require("ejs");
engine = require("ejs-mate");
const path = require("path");

app.engine("ejs", engine);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("home.ejs");
});

app.listen(3000);
