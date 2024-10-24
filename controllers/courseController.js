import { catchAsynchError } from "../middlewares/catchAsynchError.js";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler.js";
import { Stats } from "../models/Stats.js";
/**
 * The function getAllCourses sends a response of "working" when called.
 * @param req - The `req` parameter in the `getAllCourses` function typically represents the HTTP
 * request object, which contains information about the incoming request such as headers, parameters,
 * body, etc. It is used to access data sent by the client to the server.
 * @param res - The `res` parameter in the `getAllCourses` function is the response object that is used
 * to send a response back to the client making the request. In this case, the function is sending the
 * string "working" as the response.
 * @param next - The `next` parameter in the function `getAllCourses` is a callback function that is
 * used to pass control to the next middleware function in the stack. It is typically used in
 * Express.js to move to the next middleware function in the chain. If there are multiple middleware
 * functions in a route, `
 */

// Exporting a function that retrieves all courses from the database.
export const getAllCourses = catchAsynchError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  // Awaiting the retrieval of all courses using the find() method on the Course model.
  const courses = await Course.find({
    title: { $regex: keyword, $options: "i" },
    category: { $regex: category, $options: "i" },
  }).select("-lectures");

  // Sending a response with status 200 (OK), success set to true, and the retrieved courses.
  res.status(200).json({
    success: true, // Indicates the request was successful.
    courses, // Sends the list of courses retrieved from the database.
  });
});

// Exporting a function that creates a new course.
export const createCourse = catchAsynchError(async (req, res, next) => {
  // Destructuring the properties (title, description, category, createdBy) from the request body.
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy)
    return next(new ErrorHandler("Please add all filed", 400));

  // Extracting the file (e.g., image, document) from the request, which can be handled further.
  const file = req.file;

  const fileUri = getDataUri(file);
  // console.log(fileUri.content);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  // Awaiting the creation of a new course in the Course model using the extracted properties.
  await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  // Sending a response with status 200 (OK), success set to true, and courses (note: this may need adjustment since courses are not fetched again).
  res.status(201).json({
    success: true, // Indicates the request was successful.
    message: "Course created succesfully. You can add lectures now", // Sends courses (but it should likely be the created course or updated course list).
  });
});

export const getCourseLectures = catchAsynchError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  course.views += 1;
  await course.save();

  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

// max video size 100mb
export const addLecture = catchAsynchError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  const file = req.file;
  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.lectures.push({
    title,
    description,
    video: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture added in Course",
  });
});

export const deleteCourse = catchAsynchError(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course not found", 404));
  // console.log(course.poster.public_id);

  await cloudinary.v2.uploader.destroy(course.poster.public_id);

  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: "video",
    });
  }
  await Course.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Course Deleted Successfully",
  });
});

export const deleteLecture = catchAsynchError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully",
  });
});

Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const courses = await Course.find({});
  let totalViews = 0;
  for (let i = 0; i < courses.length; i++) {
    totalViews += courses[i].views;
  }

  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
