module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be logged in to continue.");
    return res.redirect("/login");
  }
  next();
};
