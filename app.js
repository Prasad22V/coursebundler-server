import express from "express";
import { config } from "dotenv";
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config({
  path: "./config/config.env",
});

const app = express();

// using middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// importing & using routes
import course from "./routes/courseRoute.js";
import user from "./routes/userRoutes.js";
import payment from "./routes/paymetRoutes.js";
import other from "./routes/otherRoute.js";

/* `app.use("/api/v1", course)` is setting up a middleware in the Express application (`app`). This
middleware is specifying that any requests that start with the path "/api/v1" should be handled by
the routes defined in the `course` module. This helps in organizing and routing requests based on
the specified path prefix. */
app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", payment);
app.use("/api/v1", other);

export default app;

app.get("/", (req, res) =>
  res.send(
    `<h1>Site is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
  )
);
app.use(ErrorMiddleware);
