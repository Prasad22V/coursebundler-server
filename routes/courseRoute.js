import express from "express";
import {
  addLecture,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
  getCourseLectures,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import {
  authorizeAdmin,
  authorizeSubscriber,
  isAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// Get all course without lectures
router.route("/courses").get(getAllCourses);

// create new course only admin
router
  .route("/createcourse")
  .post(isAuthenticated, authorizeAdmin, singleUpload, createCourse);

// Add  lectures , delete lec, get course details
router
  .route("/course/:id")
  .get(isAuthenticated, authorizeSubscriber, getCourseLectures)
  .post(isAuthenticated, authorizeAdmin, singleUpload, addLecture)
  .delete(isAuthenticated, authorizeAdmin, deleteCourse);

// Delete lectures

router.route("/lecture").delete(isAuthenticated, authorizeAdmin, deleteLecture);

export default router;
