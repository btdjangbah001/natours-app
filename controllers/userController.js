const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require('./../utils/appError');
const {
    deleteOne,
    updateOne,
    getOne,
    getAll
} = require("./handlerFactory");

filteredObj = (obj, ...includedFields) => {
    const acceptedFields = {}
    Object.keys(obj).forEach(el => {
        if (includedFields.includes(el))
            acceptedFields[el] = obj[el]
    });
    return acceptedFields;
}

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.confirmPassword)
        return next(new AppError("This route is not for user updates. Please use the /update-password route!", 400));

    const filteredBody = filteredObj(req.body, "name", "email")

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
        active: false
    });

    res.status(204).json({
        status: "success",
        data: null
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        message: "This route is not implemented! Please use the /signup route instead."
    });
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;

    next();
}

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);