const express = require("express");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("ejs", ejsMate);
app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.render("./listings/landing.ejs");
});

app.get("/login", (req, res) => {
  res.render("./listings/login.ejs");
});

app.get("/signup", (req, res) => {
  res.render("./listings/signup.ejs");
});

app.get("/browse", (req, res) => {
  res.render("./listings/browseBooks.ejs");
});