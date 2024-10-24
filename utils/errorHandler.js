/* The ErrorHandler class extends the Error class in JavaScript to include a statusCode property for
handling errors. */
class ErrorHandler extends Error {
  
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
  }
}

export default ErrorHandler;
