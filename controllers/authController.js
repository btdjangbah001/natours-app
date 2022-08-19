const crypto = require("crypto");
const {
    promisify
} = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
    return jwt.sign({
        id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true

    res.cookie("jwt", token, cookieOptions);

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    console.log(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        role: req.body.role
    });

    newUser.password = undefined;

    createSendToken(newUser, 201, res)
});

exports.login = catchAsync(async (req, res, next) => {
    const {
        email,
        password
    } = req.body;

    if (!email || !password)
        return next(new AppError("Please provide email and password.", 400));

    const user = await User.findOne({
        email
    }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError("Incorrect email or password.", 401));

    user.password = undefined;

    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie("jwt", "loggedOut", {
        expires: new Date(Date.now() + 5000),
        httpOnly: true
    });

    res.status(200).json({
        status: "success"
    });
}

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // Get token and make sure its sent
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
        token = req.headers.authorization.split(" ")[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token) return next(new AppError("You are not logged in. Please make sure you are logged in before trying to access this page."));

    // Verificarion of token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decode.id);
    if (!currentUser) return next(new AppError("The user belonging to this token no longer exists!", 401));

    // Verify is passwords have been changed since token was issued
    if (currentUser.changedPasswordAfter(decode.iat)) {
        return next(new AppError("User must login again after changing password", 401));
    }

    req.user = currentUser;
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {

        try { // Verificarion of token
            const decode = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // Check if user still exists
            const currentUser = await User.findById(decode.id);
            if (!currentUser) return next();

            // Verify is passwords have been changed since token was issued
            if (currentUser.changedPasswordAfter(decode.iat)) {
                return next();
            }

            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action!", 403))
        };

        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({
        email: req.body.email
    });

    if (!user) return next(new AppError("No user found with that email.", 404));

    console.log(user);

    const resetToken = user.createPasswordResetToken();

    await user.save({
        validateBeforeSave: false
    });

    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Please submit a PATCH request to ${resetURL} to update your password.\nPlease ignore this email if you did not request for a password reset.`

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 min).",
            message
        });

        res.send({
            status: "success",
            message: "Email with password reset link succesfully sent."
        })
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpires = undefined;

        await user.save({
            validateBeforeSave: false
        });

        next(new AppError("There was an error sending password reset link. Please try again later.", 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPassword: hashedToken,
        resetPasswordTokenExpires: {
            $gt: Date.now()
        }
    });

    if (!user) return next(new AppError("Token is invalid or expired!"));

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;

    await user.save();

    user.password = undefined;
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.correctPassword(req.body.currentPassword, user.password)))
        return next(new AppError("Your current password is wrong!", 401));

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;

    await user.save();

    createSendToken(user, 200, res);
})