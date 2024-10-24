import express from "express";
import {
  addtoPlaylist,
  changePassword,
  deleteMyProfile,
  deleteUser,
  forgetPassword,
  getAllUsers,
  getMyProfile,
  login,
  logout,
  register,
  removeFromPlaylist,
  resetPassword,
  updateProfile,
  updateprofilepicture,
  updateUserRole,
} from "../controllers/userController.js";
import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";
const router = express.Router();

//  register routes
router.route("/register").post(singleUpload, register);

//  Login routes
router.route("/login").post(login);

//  logout routes
router.route("/logout").get(logout);

// getmyprofile routes
router.route("/me").get(isAuthenticated, getMyProfile);

// Delete my profile
router.route("/me").delete(isAuthenticated, deleteMyProfile);


// change password  routes
router.route("/changepassword").put(isAuthenticated, changePassword);

// update profile routes
router.route("/updateprofile").put(isAuthenticated, updateProfile);

// update my profilepictures routes
router
  .route("/updateprofilepicture")
  .put(isAuthenticated, singleUpload, updateprofilepicture);

//  forget password routes
router.route("/forgetpassword").post(forgetPassword);

//  change password routes
router.route("/resetpassword/:token").put(resetPassword);

// add to playlist routes
router.route("/addtoplaylist").post(isAuthenticated, addtoPlaylist);

//  remove from playlist routes
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

// admin routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);
router
  .route("/admin/user/:id")
  .put(isAuthenticated, authorizeAdmin, updateUserRole)
  .delete(isAuthenticated, authorizeAdmin, deleteUser);

export default router;
