import { config } from "dotenv";
import express from "express";
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

// Manually setting CORS headers
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_URL || "http://localhost:3000"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Handling preflight requests
app.options("*", (req, res) => {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_URL || "http://localhost:3000"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200); // Respond with OK status for preflight
});

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
    `<h1>Welcome! Server is working. Click <a href=${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }>here</a> to visit frontend</h1>`
  )
);
app.use(ErrorMiddleware);
