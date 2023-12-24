const User = require("../models/user");

module.exports = (req, res, next) => {
  const userId = req.userId;
  User.findById({ _id: userId })
    .then((user) => {
      if (!user.admin) {
        const error = new Error("Not authorised to perform action");
        error.statusCode = 401;
        throw error;
      }
    })
    .catch((err) => {
      err.statusCode = err.statusCode || 500;
      throw err;
    });
  next();
};
