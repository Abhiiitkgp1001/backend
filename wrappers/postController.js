import { validationResult } from "express-validator";
import mongoose from "mongoose";

const postData = async (req, res, next, body) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Start a MongoDB transaction
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Validation Failed");
      err.statusCode = 409;
      err.data = errors.array();
      throw err;
    }

    let response = await body(req, res, next, session);
    // If all documents are successfully created, commit the transaction
    await session.commitTransaction();
    res.status(response.status).json(response.data);
  } catch (err) {
    console.log(`${err}`);
    // If an error occurs, abort the transaction and handle the error
    await session.abortTransaction();
    console.error("Transaction aborted:", err);
  } finally {
    // Ending the session
    await session.endSession();
    next(err);
  }
};

export { postData };
