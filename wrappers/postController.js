import { validationResult } from "express-validator";
import mongoose from "mongoose";

const postData = async (req, res, next, body) => {
  const session = await mongoose.startSession();
  try {
    // Start a MongoDB transaction
    session.startTransaction();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Validation Failed");
      err.statusCode = 409;
      err.data = errors.array();
      throw err;
    }

    let response = await body(req, res, next, session);
    // If all documents are successfully created, commit the transaction
    if (session.transaction != null && session.inTransaction()) {
      await session.commitTransaction();
    }
    await session.endSession();
    res.status(response.status).json(response.data);
  } catch (err) {
    console.log(`${err}`);
    // If an error occurs, abort the transaction and handle the error
    try {
      if (session.transaction != null && session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.error("Transaction aborted:", err);
    } catch (abortError) {
      // Handle the case where aborting the transaction fails
      console.error("Error aborting transaction:", abortError);
    }
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export { postData };
