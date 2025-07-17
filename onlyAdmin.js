module.exports.isAdmin = (req, res, next) => {
    // 🧭 Not logged in
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      req.flash("error", "You must be logged in to access admin features.");
      return res.redirect("/login");
    }
  
    // 🔒 Logged in but not admin
    if (req.user.email !== "admin@bookloop.in") {
      req.flash("error", "You do not have admin access.");
      return res.redirect("/login");
    }
  
    // ✅ Logged in as admin
    return next();
  };
  