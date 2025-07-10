if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
  console.log("ENV Loaded:", {
    cloud_name: process.env.cloud_name,
    api_key: process.env.API_Key,
    api_secret: process.env.API_Secret,
  });
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
const Book = require("./models/bookCard.js");
const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });
const { bookSchema } = require("./validateBook.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("ejs", ejsMate);
app.use(express.static("public"));

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
app.get("/browse", async (req, res) => {
  console.log("Route hit!");
  try {
    // 1. Get sort value from query
    const sort = req.query.sort || "price-low"; // default to 'newest'

    // 2. Fetch books from DB
    let books = await Book.find().lean(); // .lean() for plain JS objects

    // 3. Sort books in JS (or via MongoDB for efficiency)
    switch (sort) {
      case "newest":
        books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        books.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "price-low":
        books.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        books.sort((a, b) => b.price - a.price);
        break;
      case "popularity":
        books.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case "alphabetical":
        books.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alphabetical-desc":
        books.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    // 4. If AJAX request, render partial. Else, render full page
    if (req.xhr) {
      res.render("layouts/bookListSort", { books }, (err, html) => {
        if (err) return res.status(500).send("Error rendering partial");
        res.send(html);
      });
    }
     else {
      res.render("./listings/browseBooks", {
        books,
        currentView: "grid",
        sort,
      });
    }
  } catch (err) {
    res.status(500).send("Error loading books");
  }
});

app.get("/sell", (req, res) => {
  res.render("./listings/sellBooks.ejs");
});
const validateSchema = (req, res, next) => {
  let { error } = bookSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw errMsg;
  } else {
    next();
  }
};

app.post(
  "/sell",
  validateSchema,
  upload.fields([
    { name: "cover[image]", maxCount: 1 },
    { name: "additionalPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const bookData = req.body;
      const coverImage = req.files["cover[image]"]
        ? req.files["cover[image]"][0].path
        : null;
      const additionalPhotos = req.files["additionalPhotos"]
        ? req.files["additionalPhotos"].map((file) => file.path)
        : [];

      const newBook = new Book({
        ...bookData,
        bookCoverPhoto: coverImage,
        additionalPhotos: additionalPhotos,
      });
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      await newBook.save();
      res.redirect("/success");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving book");
    }
  }
);

app.get("/success", (req, res) => {
  res.render("./listings/successList.ejs");
});

app.get("/myprofile", (req, res) => {
  res.render("./listings/myProfile.ejs");
});

app.get("/about", (req, res) => {
  res.render("./listings/about.ejs");
});

app.get("/contact", (req, res) => {
  res.render("./listings/contact.ejs");
});
app.get("/privacy", (req, res) => {
  res.render("./listings/privacy.ejs");
});
app.get("/faq", (req, res) => {
  res.render("./listings/faq.ejs");
});

app.get("/terms", (req, res) => {
  res.render("./listings/terms.ejs");
});
