if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  
}
require("dotenv").config();
const dbUrl = process.env.DB_URL;
const express = require("express");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const Book = require('./models/bookCard.js');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("ejs", ejsMate);
app.use(express.static('public'));


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}
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

// Only fetch and render books, no wishlist
app.get('/browse', async (req, res) => {
  try {
    const books = await Book.find();
    res.render('./listings/browseBooks', { books, currentView: 'grid' });
  } catch (err) {
    res.status(500).send('Error loading books');
  }
});

