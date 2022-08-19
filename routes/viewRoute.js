const express = require("express");
const {
    getOverview,
    getTour,
    login
} = require("./../controllers/viewController");
const {
    isLoggedIn
} = require("./../controllers/authController");

const router = express.Router();

router.use(isLoggedIn);

router.get("/", getOverview);
router.get("/tour/:slug", getTour);
router.get("/login", login);

module.exports = router;