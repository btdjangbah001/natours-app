const express = require("express");
const {
    getAllTours,
    createTour,
    getTour,
    updateTour,
    deleteTour,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances
} = require("./../controllers/tourController");
const {
    protect,
    restrictTo
} = require("./../controllers/authController");
const reviewRouter = require("./reviewRoute");

const router = express.Router();

router.use("/:tourId/reviews", reviewRouter);

// router.param("id", checkID);
router.route("/top-5-cheap").get(aliasTopTours, getAllTours);

router.route("/tour-stats").get(getTourStats);

router.route("/monthly-plan/:year").get(protect, restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan);

router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(getToursWithin);

router.route("/distances/center/:latlng/unit/:unit").get(getDistances);

router
    .route("/")
    .get(getAllTours)
    .post(protect, restrictTo("admin", "lead-guide"), createTour);
// .post(checkBody, createTour);

router
    .route("/:id")
    .get(getTour)
    .patch(protect, restrictTo("lead-guide", "admin"), updateTour)
    .delete(protect, restrictTo("lead-guide", "admin"), deleteTour);

module.exports = router;