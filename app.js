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
const { isLoggedIn } = require("./isLoggedIn.js");
const Notification = require("./models/notificationSchema.js");

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
      console.log("Login failed:", info.message);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }

      // 🔐 Check if the user's email is the admin email
      if (user.email === "admin@bookloop.in") {
        return res.redirect("/admin");
      }

      // 🎯 Normal user gets redirected to browse
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
app.get("/browse", isLoggedIn, async (req, res) => {
  try {
    // 1. Get sort and search values from query
    const sort = req.query.sort || "newest"; // default to 'newest'
    const search = req.query.search ? req.query.search.trim() : "";
    const userEmail = req.user.email.toLowerCase();
    const unreadCount = await Notification.countDocuments({
      recipientEmail: userEmail,
      read: false,
    });
    const notifications = await Notification.find({
      recipientEmail: userEmail,
    }).sort({ timestamp: -1 });

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
      res.render(
        "layouts/bookListSort",
        { books, currentView: "grid" },
        (err, html) => {
          if (err) {
            console.log(err);
            return res.status(500).send("Error rendering book list");
          }

          res.send(html);
        }
      );
    } else {
      res.render("./listings/browseBooks", {
        books,
        currentView: "grid",
        sort,
        notifications,
        unreadCount,
        search, // so you can preserve search value in the input
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading books");
  }
});

app.get("/sell", isLoggedIn, (req, res) => {
  res.render("./listings/sellBooks.ejs");
});

app.post(
  "/sell",
  isLoggedIn,
  validateBookSchema,
  upload.fields([
    { name: "cover[image]", maxCount: 1 },
    { name: "additionalPhotos", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const bookData = req.body;
      bookData.userEmail = req.user.email;
      bookData.seller.sellerEmail = req.user.email;
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

app.get("/myprofile", isLoggedIn, async (req, res) => {
  try {
    const userEmail = req.user.email; // from Passport session
    const userBooks = await Book.find({ userEmail }); // filter

    res.render("./listings/myProfile.ejs", { userBooks }); // 👈 pass books
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
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
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    res.redirect("/");
  });
});

app.get("/browse/:id/buy", isLoggedIn, async (req, res) => {
  const bookId = req.params.id;
  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).send("Book not found");
    res.render("./listings/buyBook.ejs", {
      book,
      message: "Your action was successful!",
      messageType: "success",
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});
app.get("/admin", async (req, res) => {
  const pendingBooks = await Book.find({ status: "pending" });
  res.render("./listings/adminDashboard.ejs", { books: pendingBooks });
});
app.post("/admin/books/:id/approve", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
 
    
    if (!book) {
      return res.status(404).send("Book not found");
    }
    if (!book.userEmail) {
      return res.status(400).send("Seller email missing");
    }

    // Update status
    book.status = "accepted";
    await book.save();

    // Create notification
    const newNotification = new Notification({
      recipientEmail: book.userEmail.trim().toLowerCase(),
      message: "✅ Your book listing has been approved!",
      type: "listing_update",
      read: false
    });

    await newNotification.save();

    res.redirect("/admin");
  } catch (err) {
    console.error("Error approving book:", err);
    res.status(500).send("Server error");
  }
});


app.post("/admin/books/:id/reject", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
  
    
    if (!book) {
      return res.status(404).send("Book not found");
    }
    if (!book.userEmail) {
      return res.status(400).send("Seller email missing");
    }

    // Update status
    book.status = "rejected";
    await book.save();

    // Create notification
    const newNotification = new Notification({
      recipientEmail: book.userEmail.trim().toLowerCase(),
      message: "❌ Your book listing has been rejected!",
      type: "listing_update",
      read: false
    });

    await newNotification.save();

    res.redirect("/admin");
  } catch (err) {
    console.error("Error approving book:", err);
    res.status(500).send("Server error");
  }
});

app.post("/admin/books/:id/alter", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
  
    
    if (!book) {
      return res.status(404).send("Book not found");
    }
    if (!book.userEmail) {
      return res.status(400).send("Seller email missing");
    }

    // Update status
    book.status = "alteration_requested";
    await book.save();

    // Create notification
    const newNotification = new Notification({
      recipientEmail: book.userEmail.trim().toLowerCase(),
      message: "⚠️ Your book listing need alteration!",
      type: "listing_update",
      read: false
    });

    await newNotification.save();

    res.redirect("/admin");
  } catch (err) {
    console.error("Error approving book:", err);
    res.status(500).send("Server error");
  }
  
});

// Route: Send notification to specific user
app.post("/admin/notifyUser", async (req, res) => {
  try {
    const { email, message, type } = req.body;

    // Basic validation
    if (!email || !message) {
      return res.status(400).send("Email and message are required.");
    }

    // Optional: Check if user exists
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).send("No user found with that email.");
    }

    // Create and save notification
    const newNotification = new Notification({
      recipientEmail: email.trim().toLowerCase(),
      message: message.trim(),
      type: type || "admin_message",
      read: false,
    });

    await newNotification.save();

    res.redirect("/admin"); // or res.status(200).send("Notification sent.");
  } catch (err) {
    console.error("Error sending notification:", err);
    res.status(500).send("Server error");
  }
});

app.get("/notifications", isLoggedIn, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    const notifications = await Notification.find({
      recipientEmail: userEmail,
    }).sort({ timestamp: -1 });
    res.render("./listings/notification.ejs", { notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).send("Server error");
  }
});
// GET route to render edit form
app.get("/books/:id/edit", isLoggedIn, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).send("Book not found");

    if (book.userEmail !== req.user.email || 
      (book.status !== "alteration_requested" && book.status !== "rejected" && book.status !== "pending")) {
  
      return res.status(403).send("Unauthorized to edit this listing");
    }

    res.render("./listings/edit.ejs", { book });
  } catch (err) {
    console.error("Edit route error:", err);
    res.status(500).send("Server error");
  }
});
// POST route to update edited book
app.post("/books/:id/edit", isLoggedIn, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.userEmail !== req.user.email ||
       (book.status !== "alteration_requested" && book.status !== "rejected" && book.status !== "pending")) {
      return res.status(403).send("Unauthorized to update");
    }

    // Update relevant fields
    book.title = req.body.title;
    book.authors = req.body.authors;
    book.genre = req.body.genre;
    book.description = req.body.description;
    book.price = req.body.price;
    book.condition = req.body.condition;
    book.publisher = req.body.publisher;
    book.edition = req.body.edition;
    book.language = req.body.language;
    book.format = req.body.format;

    // Reset status to pending after edits
    book.status = "pending";

    await book.save();
    res.redirect("/myprofile");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Server error");
  }
});
app.post("/books/:id/interest", isLoggedIn, async (req, res) => {
  const book = await Book.findById(req.params.id);
  console.log("Book found:", book);
  if (!book) return res.status(404).send("Book not found");

  const sellerEmail = book.userEmail;
  console.log("Seller Email:", sellerEmail);

  // Save notification for seller
  await Notification.create({
    recipientEmail: sellerEmail,
    type: "listing_update",
    message: `📬 Someone is interested in your book: "${book.title}". Kindly check your Contact`,
    read: false
  });

  res.json({
    contactDetails: book.contactDetails,
    contactPreference: book.contactPreference
  });
});
