const express = require("express");
const User = require("../models/user");
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const router = express.Router();
const isAuth = require("../middlewares/auth");
const apiAuth = require("../middlewares/apiEndPointAuth");

router.post(
  "/signup-initiate",
  apiAuth,
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
  apiAuth,
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
  apiAuth,
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
  apiAuth,
  [body("email", "please enter valid email").isEmail()],
  authController.postForgotPassword
);

router.post(
  "/reset_password",
  apiAuth,
  [
    body("email", "Please enter your email").trim().isEmail(),
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
        // console.log(val);
        // console.log(req.body.password);
        if (val !== req.body.password) {
          console.log("password do not match");
          return Promise.reject("Password should match");
        }
        return true;
      }),
  ],
  authController.postResetPassword
);

router.post(
  "/change_password",
  apiAuth,
  isAuth,
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
          return Promise.reject("Password should match");
        }
      }),
  ],
  authController.postChangePassword
);

router.post(
  "/generate_otp",
  apiAuth,
  [body("email").trim().isEmail()],
  authController.postGenerateOtp
);

router.post("/validate_otp", apiAuth, authController.postValidateOtp);

router.get("/get_user", apiAuth, isAuth, authController.getUser);

router.post("/verify_token", apiAuth, isAuth, authController.postVerifyToken);

router.get("/all_users", apiAuth, authController.getAllUsers);

module.exports = router;
