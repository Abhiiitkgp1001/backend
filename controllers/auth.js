const Profile = require("../models/profile");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../utils/sendEmail");
const crypto = require("crypto");
const redisClient = require("../utils/redisClient");
const UserDto = require("../dtos/user.dto");
const { Storage } = require("@google-cloud/storage");

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
        },
        "supersecret",
        { expiresIn: "1h" }
      );
      res.status(201).json({
        message: "User SignedUp successfully",
        user: savedUser,
        token: token,
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
      if (user.accountLock) {
        // handle if user account is locked so cant sign in
        const err = new Error("Account Locked");
        err.statusCode = 400;
        throw err;
      }
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
    .populate({
      path: "profile",
    })
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

// uploading profile  image
const bucketName = process.env.BUCKET_NAME;
let projectId = process.env.PROJECT_ID;
let keyFilename = process.env.GCP_KEY_FILE;
const storageClient = new Storage({
  projectId,
  keyFilename,
});
const generateSignedUrl = (fileName) => {
  const blob = storageClient.bucket(bucketName).file(fileName);

  return blob
    .getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    })
    .then(([signedUrl]) => {
      console.log(`Generated Signed URL for ${fileName}`);
      console.log(signedUrl);
      return signedUrl;
    });
};

exports.get_profile = (req, res, next) => {
  console.log("step 1");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  const user_id = req.params.user_id;
  console.log("user_id:" + user_id);
  console.log("step 2");
  User.find({ _id: user_id }, { profile: 1 })
    .exec()
    .then((user) => {
      console.log(user[0]);
      console.log(user[0].profile);
      Profile.findById(user[0].profile)
        .exec()
        .then((profile) => {
          if (!profile.profile_pic) {
            res.status(200).send(profile);
            return;
          }
          generateSignedUrl(profile.profile_pic)
            .then((signedUrl) => {
              profile.profile_pic = signedUrl;
              res.status(200).send(profile);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send({ message: "Internal Server Error" });
            });
        })
        .catch((err) => {
          console.log(err);
          res.status(404).send({ message: "Profile not found" });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send({ message: "User not found" });
    });
};

exports.update_profile = (req, res, next) => {
  console.log("step 1");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation Failed");
    err.statusCode = 400;
    err.data = errors.array();
    throw err;
  }
  console.log("step 2");
  let filename = null;

  const obj = {};
  if (req.file) {
    const bucket = storageClient.bucket(bucketName);
    const blob = bucket.file(Date.now() + req.file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on("error", (err) => {
      console.error("Error uploading to GCP:", err);
      res
        .status(500)
        .send({ message: "Internal Server Error: Unable to Upload file to " });
    });

    blobStream.on("finish", () => {
      console.log("Finished file upload");
    });

    filename = blob.name;
    blobStream.end(req.file.buffer);
  }
  if (req.body.first_name) {
    obj.first_name = req.body.first_name;
  }
  if (req.body.last_name) {
    obj.last_name = req.body.last_name;
  }
  if (req.body.email) {
    obj.email = req.body.email;
  }
  if (req.body.phone_number) {
    obj.phone_number = req.body.phone_number;
  }
  if (req.body.mobile_no) {
    obj.mobile_no = req.body.mobile_no;
  }
  if (req.body.driving_license_no) {
    obj.driving_license_no = req.body.driving_license_no;
  }
  if (req.body.address) {
    obj.address = req.body.address;
  }
  if (req.body.pan_card_no) {
    obj.pan_card_no = req.body.pan_card_no;
  }
  if (req.body.aadhar_card_no) {
    obj.aadhar_card_no = req.body.aadhar_card_no;
  }
  if (req.file) {
    obj.profile_pic = filename;
  }

  console.log("step 3");
  User.find({ _id: req.params.user_id }, { profile: 1 })
    .then((user) => {
      if (!user) {
        console.log("User not found");
        return res.status(404).send({ message: "User not found" });
      }
      console.log(user[0]);
      Profile.find({ _id: user[0].profile }, { profile_pic: 1 })
        .then((profile) => {
          if (!profile) {
            console.log("Profile not found");
            return res.status(404).send({ message: "Profile not found" });
          }
          console.log(profile[0]);
          const oldFilename = profile[0].profile_pic;
          console.log("oldFilename:" + oldFilename);
          console.log("step 4");
          Profile.findByIdAndUpdate(user[0].profile, obj, { new: true })
            .exec()
            .then((updatedProfile) => {
              console.log("step 5");
              console.log(updatedProfile);
              if (req.file && oldFilename) {
                console.log("step 6");
                const bucket = storageClient.bucket(bucketName);
                const fileToDelete = bucket.file(oldFilename);
                fileToDelete
                  .delete()
                  .then(() => {
                    console.log(
                      `Deleted previous profile picture: ${oldFilename}`
                    );
                    res.status(200).send({ message: "Profile Updated" });
                  })
                  .catch((err) => {
                    console.error(
                      "Error deleting previous profile picture:",
                      err
                    );
                    res.status(500).send({ message: "Internal Server Error" });
                  });
              } else {
                res.status(200).send({ message: "Profile Updated" });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send({ message: "Internal Server Error" });
            });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send({ message: "Internal Server Error" });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
};
