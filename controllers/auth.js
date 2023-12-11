const Profile = require("../models/profile");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../utils/sendEmail");
const crypto = require("crypto");
const redisClient = require("../utils/redisClient");
const UserDto = require("../dtos/user.dto");

function generateOTP() {
  // Generate a random number between 100000 and 999999 (inclusive)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString(); // Convert the number to a string
}

exports.postSignUpInitiate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }

  console.log(`${req.body.email}_${req.body.type}_${req.body.machine_id}`);
  let Otp;
  User.findOne({ email: req.body.email, phone_number: req.body.phone_number })
    .then((user) => {
      if (user) {
        // res.status(409).json({ message: "User already exists!" });
        const error = new Error("User already exists!");
        error.statusCode = 409;
        throw error;
      }
      // if user doesnt exists send with given email and phone send Otp on email
      Otp = generateOTP();
      // set otp to cache for later verification
      console.log(Otp);
      return redisClient.set(
        req.body.email + "_" + req.body.type + "_" + req.body.machine_id,
        Otp,
        "EX",
        60
      );
    })
    .then((result) => {
      console.log(result);
      if (!result) {
        const error = new Error("Otp service error");
        error.statusCode = 503;
        throw error;
      }
      mailer
        .sendSignUpOtp(req.body.email, Otp)
        .then((info) => {
          console.log("Mail sent for Otp: " + info.messageId);
        })
        .catch((err) => {
          console.log(`Error Sending Mail: ${err.message}`);
        });
      res.status(200).json({ message: "Otp has been sent to your Email" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 409;
    err.data = errors.array();
    throw err;
  }
  console.log(`${req.body.email}_${req.body.type}_${req.body.machine_id}`);

  const email = req.body.email;
  const phone_number = req.body.phone_number;
  const password = req.body.password;
  const admin = req.body.admin;

  let hashpass;
  redisClient
    .get(req.body.email + "_" + req.body.type + "_" + req.body.machine_id)
    .then((otp) => {
      console.log(otp);
      if (!otp) {
        // res.status(403).json({ message: "Otp No longer valid" });
        const error = new Error("Otp No longer valid");
        error.statusCode = 403;
        throw error;
      } else if (otp !== req.body.otp) {
        //   res.status(400).json({ message: "Otp did not match" });
        const error = new Error("Otp did not match");
        error.statusCode = 400;
        throw error;
      }
      return bcrypt.hash(password, 12);
    })
    .then((hashPassword) => {
      hashpass = hashPassword;
      const profile = new Profile();
      return profile.save();
    })
    .then((profile) => {
      const user = new User({
        email: email,
        phone_number: phone_number,
        password: hashpass,
        admin: admin,
        profile: profile._id,
      });
      // Generate a unique reset token
      return user.save();
    })
    .then((savedUser) => {
      console.log("User created successfully ", savedUser);
      const token = jwt.sign(
        {
          email: savedUser.email,
          userId: savedUser._id.toString(),
          token: token,
        },
        "supersecret",
        { expiresIn: "1h" }
      );
      res.status(201).json({
        message: "User SignedUp successfully",
        user: savedUser,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postSignin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  const user_name = req.body.user_name;
  const password = req.body.password;
  let user;
  //check if password matches if not return with
  User.findOne({
    $or: [{ email: user_name }, { phone_number: user_name }],
  })
    .then((userDoc) => {
      user = userDoc;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: user.email,
          userId: user._id.toString(),
        },
        "supersecret",
        { expiresIn: "1h" }
      );
      res.status(200).json({ token: token, userId: user._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.postForgotPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  let loadedUser;
  let Otp;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        //   res.status(404).json({ message: "User not found" });
        const error = new Error("User Not Found with this Email");
        error.statusCode = 404;
        throw error;
      }
      loadedUser = user;
      // Generate a unique reset token
      Otp = generateOTP();
      //   set otp to cache
      console.log(Otp);
      return redisClient.set(
        req.body.email + "_" + req.body.type + "_" + req.body.machine_id,
        Otp,
        "EX",
        60
      );
    })
    .then((result) => {
      if (!result) {
        const error = new Error("Otp service error");
        error.statusCode = 503;
        throw error;
      }
      mailer
        .sendResetPasswordOtp(loadedUser.email, Otp)
        .then((mailInfo) => {
          if (!mailInfo) {
            //   res.status(404).json({ message: "mail could not be sent" });
            const error = new Error("Mail couldnt be sent To User Email Id");
            error.statusCode = 503;
            throw error;
          }
        })
        .catch((error) => {
          console.log(error);
        });

      res.status(200).json({
        message:
          "Password Reset Otp has been sent to your Registered email address",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// exports.getResetPassword = (req, res, next) => {};

exports.postResetPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  console.log("email: ", req.body.email);
  let loadedUser;
  redisClient
    .get(req.body.email + "_" + req.body.type + "_" + req.body.machine_id)
    .then((otp) => {
      console.log(otp);
      if (!otp) {
        // res.status(403).json({ message: "Otp No longer valid" });
        const error = new Error("Otp No longer valid");
        error.statusCode = 403;
        throw error;
      } else if (otp !== req.body.otp) {
        //   res.status(400).json({ message: "Otp did not match" });
        console.log(req.body.otp);
        const error = new Error("Otp did not match");
        error.statusCode = 400;
        throw error;
      }
      return User.findOne({
        email: req.body.email,
      });
    })
    .then((user) => {
      if (!user) {
        //   res.status(404).json({ message: "User not found" });
        const error = new Error("User Not Found with this Email");
        error.statusCode = 404;
        throw error;
      }
      loadedUser = user;
      return bcrypt.hash(req.body.password, 12);
    })
    .then((hashedPass) => {
      loadedUser.password = hashedPass;
      return loadedUser.save();
    })
    .then((savedUser) => {
      console.log(`Password changed: ${savedUser}`);
      res.status(200).json({ message: "Password changed successfully" });
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postChangePassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Error: ");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  let loadedUser;
  redisClient
    .get(req.body.email + "_" + req.body.type + "_" + req.body.machine_id)
    .then((otp) => {
      if (!otp) {
        const err = new Error("Otp no longer valid");
        err.statusCode = 503;
        throw err;
      } else if (otp !== req.body.otp) {
        const err = new Error("Otp not valid ");
        err.statusCode = 400;
        throw err;
      }
      // find user by id in req
      return User.findOne({ _id: req.userId });
    })
    .then((user) => {
      loadedUser = user;
      const old_password = req.body.old_password;
      return bcrypt.compare(old_password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        res.status(403).json({
          message: "Please Enter Your old Password Correct",
        });
      }
      return bcrypt.hash(req.body.new_password);
    })
    .then((hashedPassword) => {
      loadedUser.password = hashedPassword;
      return loadedUser.save();
    })
    .then((savedUser) => {
      console.log(`Password changed: ${savedUser}`);
      res.status(200).json({ message: "Password changed successfully" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postGenerateOtp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Error: ");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  const email = req.body.email;
  const type = req.body.type;
  const machine_id = req.body.machine_id;
  let otp = generateOTP();

  redisClient
    .set(email + "_" + type + "_" + machine_id, otp, "EX", 60)
    .then((result) => {
      if (!result) {
        const error = new Error("Otp Service Error: ");
        error.statusCode = 503;
        throw error;
      }
      mailer
        .sendSignUpOtp(req.body.email, Otp)
        .then((info) => {
          console.log("Mail sent for Otp: " + info.messageId);
        })
        .catch((err) => {
          console.log(`Error Sending Mail: ${err.message}`);
        });
      res.status(200).json({ message: "Otp has been sent to your Email" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.postVerifyToken = (req, res, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(req.body.token, "supersecret");
  } catch (err) {
    err.statusCode = 500;
    next(err);
  }
  if (!decodedToken) {
    const error = new Error("User not authenticated");
    error.statusCode = 401;
    next(error);
  }
  const userId = decodedToken.userId;
  User.findOne({ _id: userId })
    .then((user) => {
      console.log(user);
      user = UserDto.user(user);
      res.status(200).json({
        user: user,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUser = (req, res) => {
  User.findOne({ _id: req.UserId })
    .then((user) => {
      user = UserDto.user(user);
      res.status(200).json({ user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postValidateOtp = (req, res, next) => {
  // req.body.otp;
  redisClient
    .get(req.body.email + "_" + req.body.type + "_" + req.body.machine_id)
    .then((otp) => {
      console.log(otp);
      if (!otp) {
        // res.status(403).json({ message: "Otp No longer valid" });
        const error = new Error("Otp No longer valid");
        error.statusCode = 403;
        throw error;
      } else if (otp !== req.body.otp) {
        //   res.status(400).json({ message: "Otp did not match" });
        console.log(req.body.otp);
        const error = new Error("Otp did not match");
        error.statusCode = 400;
        throw error;
      }
      res.status(200).json({ message: "Otp Matched" });
    });
};

exports.getAllUsers = (req, res, next) => {
  User.find()
    .then((users) => {
      res.status(200).json({ users: users });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postCreatePilot = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 409;
    err.data = errors.array();
    throw err;
  }
  const email = req.body.email;
  const phone_number = req.body.phone_number;
  const password = req.body.password;
  const admin = req.body.admin;
  let hashPass;
  let loadedUser;
  let pilot;
  // check if user ssigned in is admin else it should not be able to create pilot
  // get user by admin user id
  User.findById(req.userId)
    .then((user) => {
      loadedUser = user;
      if (!user.admin) {
        const err = new Error("Not authorized");
        err.statusCode = 400;
        throw err;
      }
      // check if pilot allready exists
      return User.findOne({ email: email });
    })
    .then((user) => {
      if (!user) {
        return bcrypt.hash(password, 12);
      } else {
        const err = new Error("User already exists");
        err.statusCode = 400;
        throw err;
      }
    })
    .then((hash) => {
      hashPass = hash;
      const profile = new Profile();
      return profile.save();
    })
    .then((profile) => {
      const pilot = new User({
        email: email,
        phone_number: phone_number,
        password: hashPass,
        admin: admin,
        profile: profile._id,
        childUsers: null,
      });
      // Generate a unique reset token
      return pilot.save();
    })
    .then((savedPilot) => {
      pilot = savedPilot;
      console.log("Pilot created successfully ", savedPilot);
      loadedUser.childUsers.push(savedPilot._id);
      return loadedUser.save();
    })
    .then((user) => {
      res.status(201).json({
        message: "Pilot Created successfully",
        user: pilot,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getAllPilots = (req, res, next) => {
  //   console.log("getAllPilots");
  User.findById(req.userId)
    .then((user) => {
      if (!user.admin) {
        const err = new Error("Not authorized");
        err.statusCode = 400;
        throw err;
      }
      return user.populate({
        path: "childUsers",
      });
    })
    .then((user_populated) => {
      const allPilots = user_populated.childUsers;
      res.status(200).json({
        pilots: allPilots,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
