const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name!"]
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        lowercase: true,
        unique: true,
        validate: [validator.isEmail, "Please provide a valid email"]
    },
    photo: String,
    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: 'user'
    },
    password: {
        type: String,
        minlength: 8,
        required: [true, "Please provide a password"],
        select: false,
    },
    confirmPassword: {
        type: String,
        required: [true, "Please confirm your email"],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords do not match"
        }
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpires: Date,
    active: {
        type: Boolean,
        default: true,
    },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.confirmPassword = undefined;

    next();
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({
        active: {
            $ne: false
        }
    });
    next();
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTime) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTime < changedTimestamp;
    }

    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordTokenExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model("User", userSchema);

module.exports = User;