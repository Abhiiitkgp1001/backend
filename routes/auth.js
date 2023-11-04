const express = require("express");
const User = require("../models/user");
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const router = express.Router();

router.post(
  "/signup-initiate",
  [
    body("phone_number", "Please enter your phone number")
      .trim()
      .isMobilePhone(),
    body("email", "Please enter your email").trim().isEmail(),
  ],
  authController.postSignUpInitiate
);

router.post(
  "/signup",
  [
    body("phone_number", "Please enter your phone number")
      .trim()
      .isMobilePhone()
      .custom((value, { req }) => {
        return User.findOne({ phone_number: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Phone Number already exists!");
          }
        });
      }),
    body("email", "Please enter your email")
      .trim()
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("User already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric(),
    body("confirm_pass")
      .trim()
      .notEmpty()
      .withMessage("Please Make sure password match")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          return Promise.reject("Password does not match");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post(
  "/signin",
  [
    // Use built-in isEmail and isMobilePhone validators
    // Use built-in isEmail and isMobilePhone validators
    body("user_name", "Invalid email or phone number").custom(
      (value, { req }) => {
        // Check if the userId is either an email or a phone number
        const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
        const phoneRegex = /^[0-9]{10}$/; // Adjust the phone number regex as needed

        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          console.log("not a valid email or a phone number");
          throw new Error("Invalid email or phone number!!!!");
        }
        // test if user with email or phone is not registered
        return User.findOne({
          $or: [{ email: value }, { phone_number: value }],
        }).then((userDoc) => {
          console.log(!userDoc);
          if (!userDoc) {
            console.log("user not found");
            return Promise.reject(
              "User doesn't exists! with this email or phone number"
            );
          }
          console.log("user exists!");
          return true;
        });
      }
    ),
    body(
      "password",
      "pawword length must be between 8 to 16 and must be alphanumeric"
    )
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric(),
  ],
  authController.postSignin
);

router.post(
  "/forgot_password",
  [body("email", "please enter valid email").isEmail()],
  authController.postForgotPassword
);

router.post(
  "/reset_password",
  [
    body("password", "please enter new password")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric(),
    body("confirm_password", "Enter Password to confirm")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric()
      .custom((val, { req }) => {
        if (val !== req.body.new_password) {
          return Promise.reject("Password shoul match");
        }
      }),
  ],
  authController.postResetPassword
);

router.post(
  "/change_password",
  [
    body("old_password", "please enter old password")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric(),
    body("new_password", "please enter new password")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric(),
    body("confirm_password", "Enter Password to confirm")
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 16 })
      .isAlphanumeric()
      .custom((val, { req }) => {
        if (val !== req.body.new_password) {
          return Promise.reject("Password shoul match");
        }
      }),
  ],
  authController.postChangePassword
);

module.exports = router;
