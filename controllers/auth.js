import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserDto from "../dtos/user.dto.js";
import Address from "../models/address.js";
import Profile from "../models/profile.js";
import User from "../models/user.js";
import redisClient from "../utils/redisClient.js";
import mailer from "../utils/sendEmail.js";
import { postData } from "../wrappers/postController.js";

function generateOTP() {
  // Generate a random number between 100000 and 999999 (inclusive)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString(); // Convert the number to a string
}

const postSignUpInitiate = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    console.log(`${req.body.email}_${req.body.type}_${req.body.machine_id}`);
    let Otp;
    let user = await User.findOne({
      $or: [{ email: req.body.email }, { phone_number: req.body.phone_number }],
    });
    if (user) {
      const error = new Error("User already exists!");
      error.statusCode = 409;
      throw error;
    }
    // if user doesnt exists send with given email and phone send Otp on email
    Otp = generateOTP();
    // set otp to cache for later verification
    console.log(Otp);
    let otpRes = await redisClient.set(
      req.body.email + "_" + req.body.type + "_" + req.body.machine_id,
      Otp,
      "EX",
      60
    );
    console.log(otpRes);
    if (!otpRes) {
      const error = new Error("Otp service error");
      error.statusCode = 503;
      throw error;
    }
    const mailInfo = await mailer.sendSignUpOtp(req.body.email, Otp);
    if (!mailInfo) {
      const error = new Error("Otp Email  service error");
      error.statusCode = 503;
      throw error;
    }
    console.log("Mail sent for Otp: " + mailInfo.messageId);
    return {
      status: 200,
      data: { message: "Otp has been sent to your Email" },
    };
  };
  postData(req, res, next, body);
};

const postSignup = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    console.log(`${req.body.email}_${req.body.type}_${req.body.machine_id}`);
    const email = req.body.email;
    const phone_number = req.body.phone_number;
    const password = req.body.password;
    const admin = req.body.admin;
    let hashPass, address, working_address, profile, user;
    const otp = await redisClient.get(
      req.body.email + "_" + req.body.type + "_" + req.body.machine_id
    );
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
    hashPass = await bcrypt.hash(password, 12);
    //create two addresses for profile
    address = new Address({});

    working_address = new Address({});
    await address.save({ session: session });
    await working_address.save({ session: session });
    profile = new Profile({
      email: email,
      phone_number: phone_number,
      address: address._id,
      working_address: working_address._id,
    });
    console.log(profile._id);
    profile = await profile.save({ session: session });
    user = new User({
      email: email,
      phone_number: phone_number,
      password: hashPass,
      admin: admin,
      profile: profile._id,
    });
    address.user = user._id;
    address.profile = profile._id;
    working_address.user = user._id;
    working_address.profile = profile._id;
    await address.save({ session: session });
    await working_address.save({ session: session });
    user = await user.save({ session: session });
    profile.user = user._id;
    profile = await profile.save({ session: session });
    console.log("User created successfully ", user);
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "supersecret",
      { expiresIn: "10h" }
    );
    return {
      status: 201,
      data: {
        message: "User SignedUp successfully",
        user: user,
        token: token,
      },
    };
  };
  postData(req, res, next, body);
};

const postSignin = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    const user_name = req.body.user_name;
    const password = req.body.password;
    let user = await User.findOne({
      $or: [{ email: user_name }, { phone_number: user_name }],
    });
    console.log(user);
    if (user.accountLock) {
      // handle if user account is locked so cant sign in
      const err = new Error("Account Locked");
      err.statusCode = 400;
      throw err;
    }
    // compare password
    let passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
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
      { expiresIn: "10h" }
    );
    return {
      status: 200,
      data: { token: token, user: user },
    };
  };
  postData(req, res, next, body);
};

const postForgotPassword = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      //   res.status(404).json({ message: "User not found" });
      const error = new Error("User Not Found with this Email");
      error.statusCode = 404;
      throw error;
    }
    // Generate a unique reset token
    let otp = generateOTP();
    //   set otp to cache
    console.log(otp);

    let otpRes = await redisClient.set(
      req.body.email + "_" + req.body.type + "_" + req.body.machine_id,
      otp,
      "EX",
      60
    );
    if (!otpRes) {
      const error = new Error("Otp service error");
      error.statusCode = 503;
      throw error;
    }
    let mailInfo = await mailer.sendResetPasswordOtp(user.email, otp);
    if (!mailInfo) {
      //   res.status(404).json({ message: "mail could not be sent" });
      const error = new Error("Mail couldnt be sent To User Email Id");
      error.statusCode = 503;
      throw error;
    }
    return {
      status: 200,
      data: {
        message:
          "Password Reset Otp has been sent to your Registered email address",
      },
    };
  };
  postData(req, res, next, body);
};

const postResetPassword = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    console.log("email: ", req.body.email);
    let otp = await redisClient.get(
      req.body.email + "_" + req.body.type + "_" + req.body.machine_id
    );
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
    let user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      //   res.status(404).json({ message: "User not found" });
      const error = new Error("User Not Found with this Email");
      error.statusCode = 404;
      throw error;
    }
    let hashedPass = await bcrypt.hash(req.body.password, 12);
    user.password = hashedPass;
    user = await user.save({ session: session });
    console.log(`Password changed: ${user}`);
    return {
      status: 200,
      data: { message: "Password changed successfully" },
    };
  };
  postData(req, res, next, body);
};

const postChangePassword = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let otp = await redisClient.get(
      req.body.email + "_" + req.body.type + "_" + req.body.machine_id
    );
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
    let user = await User.findOne({ _id: req.userId });
    let old_password = req.body.old_password;
    let passMatch = await bcrypt.compare(old_password, user.password);
    if (!passMatch) {
      return {
        status: 403,
        data: {
          message: "Please Enter Your old Password Correct",
        },
      };
    }
    let newPass = await bcrypt.hash(req.body.new_password, 12);
    user.password = newPass;
    await user.save({ session: session });
    console.log(`Password changed: ${user}`);
    return {
      status: 200,
      data: {
        message: "Password changed successfully",
      },
    };
  };
  postData(req, res, next, body);
};

const postGenerateOtp = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    const email = req.body.email;
    const type = req.body.type;
    const machine_id = req.body.machine_id;
    let otp = generateOTP();
    let otpRes = await redisClient.set(
      email + "_" + type + "_" + machine_id,
      otp,
      "EX",
      60
    );
    if (!otpRes) {
      const error = new Error("Otp Service Error: ");
      error.statusCode = 503;
      throw error;
    }
    let info = await mailer.sendSignUpOtp(req.body.email, otp);
    if (!info) {
      const error = new Error("Otp Mail Service Error: ");
      error.statusCode = 503;
      throw error;
    }
    console.log("Mail sent for Otp: " + info.messageId);
    return {
      status: 200,
      data: {
        message: "Otp has been sent to your Email",
      },
    };
  };
  postData(req, res, next, body);
};

// verify token validity
const postVerifyToken = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let decodedToken;
    decodedToken = jwt.verify(req.body.token, "supersecret");
    if (!decodedToken) {
      const error = new Error("User not authenticated");
      error.statusCode = 401;
      next(error);
    }
    const userId = decodedToken.userId;
    let user = await User.findOne({ _id: userId });
    user = UserDto(user);
    return {
      status: 200,
      data: {
        user: user,
      },
    };
  };
  postData(req, res, next, body);
};

const getUser = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let user = await User.findOne({ _id: req.UserId }).populate({
      path: "profile",
      path: "pilotStats",
    });
    user = UserDto(user);
    return {
      status: 200,
      data: { user: user },
    };
  };
  postData(req, res, next, body);
};

const postValidateOtp = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let otp = await redisClient.get(
      req.body.email + "_" + req.body.type + "_" + req.body.machine_id
    );
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
    return {
      status: 200,
      data: {
        message: "Otp Matched",
      },
    };
  };
  postData(req, res, next, body);
};

const getAllUsers = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    let users = await User.find();
    return {
      status: 200,
      data: {
        users: users,
      },
    };
  };
  postData(req, res, next, body);
};

const getProfile = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    const user_id = req.params.user_id;
    const user = await User.findById(user_id);
    if (user) {
      let userProfile = await Profile.findById(user.profile);
      if (userProfile) {
        if (userProfile.profile_pic !== "") {
          const s3 = new S3Client({});
          const getFile = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: userProfile.profile_pic,
          });
          userProfile.profile_pic = await getSignedUrl(s3, getFile, {
            expiresIn: 36000,
          });
        }
        return {
          status: 200,
          data: {
            profile: userProfile || {},
          },
        };
      } else {
        const error = new Error(`Profile not found`);
        error.statusCode = 404;
        throw error;
      }
    } else {
      const error = new Error(`User not found`);
      error.statusCode = 404;
      throw error;
    }
  };

  postData(req, res, next, body);
};

const updateProfile = async (req, res, next) => {
  const body = async (req, res, next, session) => {
    const s3 = new S3Client({});
    let obj = {};
    const address = {}; // for address to be updated
    const workingAddress = {}; //  for working address to be updated
    let savedFile;
    if (req.file) {
      const key = `${req.params.user_id}`;
      const putImage = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      savedFile = await s3.send(putImage);
      obj.profile_pic = key;
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
    if (req.body.driving_license) {
      obj.driving_license = req.body.driving_license;
    }
    if (req.body.pancard) {
      obj.pancard = req.body.pancard;
    }
    if (req.body.aadhar) {
      obj.aadhar = req.body.aadhar;
    }
    if (req.body.address) {
      // get address from profile
    }
    if (req.body.working_address) {
    }

    const user = await User.findById(req.params.user_id);
    if (user) {
      let userProfile = await Profile.findById(user.profile);
      if (userProfile) {
        userProfile = await Profile.findByIdAndUpdate(userProfile._id, obj, {
          new: true,
          session: session,
        });
        const getFile = new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: userProfile.profile_pic,
        });
        userProfile.profile_pic = await getSignedUrl(s3, getFile, {
          expiresIn: 36000,
        });
        return {
          status: 200,
          data: {
            message: "Profile Updated",
            profile: userProfile,
          },
        };
      } else {
        const error = new Error(`Profile not found`);
        error.statusCode = 404;
        throw error;
      }
    } else {
      const error = new Error(`User not found`);
      error.statusCode = 404;
      throw error;
    }
  };
  await postData(req, res, next, body);
};

export {
  getAllUsers,
  getProfile,
  getUser,
  postChangePassword,
  postForgotPassword,
  postGenerateOtp,
  postResetPassword,
  postSignUpInitiate,
  postSignin,
  postSignup,
  postValidateOtp,
  postVerifyToken,
  updateProfile,
};
