import { catchAsynchError } from "../middlewares/catchAsynchError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import { Stats } from "../models/Stats.js";
// import { create } from "domain";

export const register = catchAsynchError(async (req, res, next) => {
  // Implement registration logic here
  const { name, email, password } = req.body;
  const file = req.file;

  // console.log(name, email, password);

  if (!name || !email || !password || !file)
    return next(new ErrorHandler("Please enter a all fileds", 400));
  let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("User already exists", 409));

  //   upload file from cloudinary

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    email,
    password,
    name,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });
  sendToken(res, user, "Registration successful", 201);
});

export const login = catchAsynchError(async (req, res, next) => {
  // Implement registration logic here
  const { email, password } = req.body;
  // const file = req.file;

  if (!email || !password)
    return next(new ErrorHandler("Please enter all fileds", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Incorrect Email or Password", 401));
  //   upload file from cloudinary

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return next(new ErrorHandler("Incorrect Email or Password", 401));

  sendToken(res, user, `Welcome back,${user.name}`, 200);
});

export const logout = catchAsynchError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({ success: true, message: "You have logged out Successfully" });
});

export const getMyProfile = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

export const changePassword = catchAsynchError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(new ErrorHandler(" please enter all filed ", 400));
  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) return next(new ErrorHandler("Incorrect Old Password", 401));

  user.password = newPassword;
  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Password changed successfully " });
});

export const updateProfile = catchAsynchError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Profile Updated successfully " });
});

export const updateprofilepicture = catchAsynchError(async (req, res, next) => {
  // clodinary

  const file = req.file;
  const user = await User.findById(req.user._id);

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  user.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Profile picture Updated successfully " });
});

export const forgetPassword = catchAsynchError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) return next(new ErrorHandler("User not found", 400));

  const resetToken = await user.getResetToken();
  // http://localhost:3000/resetpassword/hbfvbifubvirv

  await user.save();

  //  send token via eemial
  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  const message = `
  You are receiving this email because you requested a password reset for your CourseBundler account.${url}.If you NOt request then ignore`;

  await sendEmail(user.email, "Coursebundler Reset Password", message);

  res.status(200).json({
    success: true,
    message: `Reset Token has been sent to ${user.email}`,
  });
});

export const resetPassword = catchAsynchError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return next(new ErrorHandler("Token is invalid or expired"));

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Pasword chnage successfully ",
  });
});

export const addtoPlaylist = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.body.id);

  if (!course)
    return next(new ErrorHandler("Course is invalid or expired", 404));

  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });

  if (itemExist) return next(new ErrorHandler("Item Already Exist", 409));

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Added to playlist successfully ",
  });
});

export const removeFromPlaylist = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.query.id);
  if (!course) return next(new ErrorHandler("Invalid Course Id", 404));

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });

  user.playlist = newPlaylist;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Removed From Playlist",
  });
});

// Admin controllers

export const getAllUsers = catchAsynchError(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user.role === "user") user.role = "admin";
  else user.role = "user";
  await user.save();

  res.status(200).json({
    success: true,
    message: "Role has been updated",
  });
});

export const deleteUser = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User has been deleted successfully",
  });
});

export const deleteMyProfile = catchAsynchError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  await user.deleteOne();

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User has been deleted successfully",
    });
});

User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const subscription = await User.find({ "subscription.status": "active" });
  stats[0].users = await User.countDocuments();
  stats[0].subscription = subscription.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});


