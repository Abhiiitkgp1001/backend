import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  const token = req.get("Authorization");
  if (!token) {
    const error = new Error("Authentication Token Error");
    error.statusCode = 401;
    throw error;
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token.split(" ")[1], "supersecret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("User not authenticated");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};

export { isAuth };
