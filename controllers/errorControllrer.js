const AppError = require("./../utils/appError");

const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateKeyDB = (err) => {
    const value = err.keyValue.name;
    console.log(value);
    const message = `Duplicate field value: ${value}. Please try another value!`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = (err) => {
    // const errorMessages = [...err.errors].map(el => el.message);
    const message = err.message;
    // const message = `Invalid input data: ${errorMessages.join(". ")}`;
    return new AppError(message, 400);
}

const handleJsonWebTokenError = () => new AppError("Invalid token. Please sign in again!", 401);

const handleTokenExpiredError = () => new AppError("Your token has expired. Please sign in again!", 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        console.error("ERROR: ", err);

        res.status(500).json({
            status: "error",
            message: "Something went very wrong"
        });
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "production") {
        console.log(err);
        let error = {
            ...err
        }

        if (error.name === "CastError") error = handleCastError(error);
        if (error.code === 11000) error = handleDuplicateKeyDB(error);
        if (err.name === "ValidationError") error = handleValidationErrorDB(err);
        if (err.name === "JsonWebTokenError") error = handleJsonWebTokenError();
        if (err.name === "TokenExpiredError") error = handleTokenExpiredError();

        sendErrorProd(error, res);
    } else if (process.env.NODE_ENV = "development") {
        sendErrorDev(err, res);
    }
}