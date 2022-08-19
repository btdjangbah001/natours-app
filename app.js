const path = require("path");

const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorControllrer");
const tourRouter = require("./routes/tourRoute");
const userRouter = require("./routes/userRoute");
const reviewRouter = require("./routes/reviewRoute");
const viewRouter = require("./routes/viewRoute");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//Global middlewares
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'script-src': ["'self'", "https://cdnjs.cloudflare.com/"]
        }
    }
}));

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP address. Please try again after an hour!"
});

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api", limiter);

app.use(express.json({
    limit: "10kb"
}));
app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.use(hpp({
    whitelist: [
        "duration", "maxGroupSize", "difficulty", "ratingsAverage", "ratingsQuantity", "price", "priceDiscount", "startDates",
    ]
}))

// Custom middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
    // const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
    // err.statusCode = 404;
    // err.status = "fail";

    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;