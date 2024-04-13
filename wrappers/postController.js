import { validationResult } from "express-validator";
import mongoose from "mongoose";

const postData = async (req, res, next, body) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Start a MongoDB transaction
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.statusCode = 409;
      error.data = errors.array();
      throw error;
    }

    let response = await body(req, res, next, session);
    // If all documents are successfully created, commit the transaction
    await session.commitTransaction();
    await session.endSession();
    res.status(response.status).json(response.data);
    // return response;
  } catch (err) {
    console.log(`error in postData: ${err}`);
    // If an error occurs, abort the transaction and handle the error
    await session.abortTransaction();
    console.error("Transaction aborted:", err.message);
    await session.endSession();
    next(err);
  }
};

export { postData };
