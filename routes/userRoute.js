const express = require("express");
const {
    getAllUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe,
    getMe
} = require("./../controllers/userController");
const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    protect,
    updatePassword,
    restrictTo,
    logout
} = require("./../controllers/authController");

const router = express.Router();

router.get("/me", protect, getMe, getUser);

router.route("/signup").post(signup);
router.route("/login").post(login);

router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").patch(resetPassword);

router.use(protect);

router.route("/logout").get(logout);
router.route("/update-my-password").patch(updatePassword);
router.patch("/update-me", updateMe);
router.delete("/delete-me", deleteMe);

router.use(restrictTo("admin"));

router
    .route("/")
    .get(getAllUsers)
    .post(createUser);

router
    .route("/:id")
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;