const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.get("x-auth-token");
  // console.log(token);
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "supersecret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Api EndPoint Error");
    error.statusCode = 401;
    throw error;
  }
  next();
};
