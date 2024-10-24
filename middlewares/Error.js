/**
 * The `ErrorMiddleware` function handles errors by setting a status code and message, then sending a
 * JSON response with the error details.
 * @param err - The `err` parameter in the `ErrorMiddleware` function represents the error object that
 * is passed to the middleware function. It contains information about the error that occurred during
 * the request processing.
 * @param req - The `req` parameter in the `ErrorMiddleware` function stands for the request object. It
 * contains information about the HTTP request that was made, such as the request headers, parameters,
 * body, URL, and more. This object is typically used to access data sent by the client to the server.
 * @param res - The `res` parameter in the `ErrorMiddleware` function represents the response object in
 * Express.js. It is used to send a response back to the client with the specified status code and
 * data.
 * @param next - The `next` parameter in the `ErrorMiddleware` function is a reference to the next
 * middleware function in the application's request-response cycle. It is a callback function that is
 * used to pass control to the next middleware function in the stack. By calling `next()`, the
 * application can move to the
 */

const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default ErrorMiddleware;
