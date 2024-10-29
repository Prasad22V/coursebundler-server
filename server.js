/* This code snippet is importing the `app` module from a file named `app.js` (or `app.ts` if it's a
TypeScript file) and then starting a server using the `listen` method. The server will listen on the
port specified in the `process.env.PORT` environment variable. Once the server is running, a message
will be logged to the console indicating that the server is running on the specified port. */
import app from "./app.js";
import { connectDB } from "./config/db.js";
import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import nodeCron from "node-cron";
import { Stats } from "./models/Stats.js";

connectDB();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
  // currency: "INR", // Replace with your desired currency code.
});

nodeCron.schedule("0 0 0 5 * *", async () => {
  try {
    await Stats.create({});
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is runing on port:${process.env.PORT}`);
});
