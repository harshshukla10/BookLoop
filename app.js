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
const { userSignupSchema } = require("./validateUser.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/userSchema.js");
const {isLoggedIn} = require("./isLoggedIn.js");

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION Store", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60,
    httpOnly: true,
  },
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("ejs", ejsMate);
app.use(express.static("public"));
app.use(passport.initialize());
app.use(session(sessionOptions));
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

app.use((req, res, next) => {
  // res.locals.success = req.flash("success");
  // res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const validateBookSchema = (req, res, next) => {
  const { error } = bookSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(", ");
    return res.status(400).send({ error: errMsg }); // or render a page with the error
  }
  next();
};

const validateUserSchema = (req, res, next) => {
  const { error } = userSignupSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(", ");
    return res.status(400).send({ error: errMsg }); // or use res.render if using EJS
  }
  next();
};

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

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login failed:", info.message); // << SEE WHY login failed // Optionally: req.flash("error", info.message); if flash is configured
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      return res.redirect("/browse");
    });
  })(req, res, next);
});

app.get("/signup", (req, res) => {
  res.render("./listings/signup.ejs");
});

app.post("/signup", validateUserSchema, async (req, res, next) => {
  const {
    email,
    password,
    confirm_password,
    first_name,
    last_name,
    institute,
    grade,
  } = req.body;
  console.log(req.body);

  try {
    if (password !== confirm_password) {
      // req.flash("error", "Passwords do not match");
      return res.redirect("/signup");
    }

    const newUser = new User({
      email,
      username: email,
      first_name,
      last_name,
      institute,
      grade,
    });
    const registeredUser = await User.register(newUser, password);

    console.log(registeredUser);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      res.redirect("/browse"); // or your homepage after login
    });
  } catch (e) {
    console.error(e);
    // req.flash("error", e.message);
    res.redirect("/signup");
  }
});

// Only fetch and render books, no wishlist
app.get("/browse", async (req, res) => {
  try {
    // 1. Get sort and search values from query
    const sort = req.query.sort || "newest"; // default to 'newest'
    const search = req.query.search ? req.query.search.trim() : "";

    // 2. Build filter for search (by title, author, isbn, keywords)
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { authors: { $regex: search, $options: "i" } },
        ],
      };
    }

    // 3. Fetch filtered books from DB
    let books = await Book.find(filter).lean();

    // 4. Sort books in JS (or via MongoDB for efficiency)
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

    // 5. If AJAX request, render partial. Else, render full page
    if (req.xhr) {
      res.render("layouts/bookListSort", { books, currentView: 'grid', }, (err, html) => {
        if (err){
            console.log(err);
            return res.status(500).send("Error rendering book list");
        } 
      
        res.send(html);
      });
    } else {
      res.render("./listings/browseBooks", {
        books,
        currentView: "grid",
        sort,
        search, // so you can preserve search value in the input
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading books");
  }
});


app.get("/sell",isLoggedIn, (req, res) => {
  res.render("./listings/sellBooks.ejs");
});

app.post(
  "/sell",isLoggedIn,
  validateBookSchema,
  upload.fields([
    { name: "cover[image]", maxCount: 1 },
    { name: "additionalPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const bookData = req.body;
      bookData.userEmail = req.user.email;
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

app.get('/myprofile',isLoggedIn, async (req, res) => {
  try {
    const userEmail = req.user.email; // from Passport session
    const userBooks = await Book.find({ userEmail }); // filter
    
    res.render('./listings/myProfile.ejs', { userBooks}); // 👈 pass books
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong.');
  }
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
