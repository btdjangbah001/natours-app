const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const {
    deleteOne,
    updateOne,
    createOne,
    getOne,
    getAll
} = require("./handlerFactory");

// Custom made middlewares

// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour ID id is ${val}`);

//     if (req.params.id * 1 >= tours.length) return res.status(404).json({
//         status: "fail",
//         message: "Invalid ID"
//     });
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) return res.status(400).json({
//         status: "fail",
//         message: "Missing name or price"
//     });
//     next();
// }

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage,price";
    req.query.fields = "name,price,ratingsAverage,summary, difficulty";
    next();
}

exports.getAllTours = getAll(Tour);
exports.createTour = createOne(Tour);
exports.getTour = getOne(Tour, {
    path: "reviews"
});

// catchAsync(async (req, res, next) => {
//     const id = req.params.id;
//     const tour = await Tour.findById(id).select("-__v").populate("reviews");
//     // Chain populate method to query when you want to popule in only one play else use a documet middleware
//     // .populate({
//     //     path: "guides",
//     //     select: "-__v -passwordChangedAt"
//     // });
//     // Tour.findOne({_id: id});

//     if (!tour) return next(new AppError("Cannot find a tour with that ID", 404));

//     res.status(200).json({
//         status: "success",
//         data: {
//             tour,
//         }
//     });
// });

exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stat = await Tour.aggregate([{
            $match: {
                ratingsAverage: {
                    $gte: 4.5
                }
            }
        },
        {
            $group: {
                _id: null,
                // _id: "$difficulty",
                numTours: {
                    $sum: 1
                },
                numRatings: {
                    $sum: "$ratingsQuantity"
                },
                avgRatings: {
                    $avg: "$ratingsAverage"
                },
                avgPrice: {
                    $avg: "$price"
                },
                minPrice: {
                    $min: "$price"
                },
                maxPrice: {
                    $max: "$price"
                }
            }
        }
    ])

    res.status(200).json({
        status: "success",
        data: {
            stat
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year;

    const tours = await Tour.aggregate([{
            $unwind: "$startDates"
        }, {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {
                    $month: "$startDates"
                },
                numOfTourStarts: {
                    $sum: 1
                },
                tours: {
                    $push: "$name"
                }
            }
        },
        {
            $addFields: {
                month: "$_id"
            }
        }, {
            $project: {
                _id: 0,
            }
        },
        {
            $sort: {
                numOfTourStarts: -1
            }
        }, {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: "success",
        data: {
            tours
        }
    });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const {
        distance,
        latlng,
        unit
    } = req.params;

    const [lat, lng] = latlng.split(",");

    const radius = unit === "mi" ? distance / 3936.2 : distance / 6378.1;

    if (!lat || !lng)
        return next(new AppError("Please provide the latitude and longitude in the cocrect format (lat,lng)", 400));

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat],
                    radius
                ]
            }
        }
    })

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            data: tours
        }
    })
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const {
        latlng,
        unit
    } = req.params;

    const [lat, lng] = latlng.split(",");

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    if (!lat || !lng)
        return next(new AppError("Please provide the latitude and longitude in the cocrect format (lat,lng)", 400));

    const distances = await Tour.aggregate([{
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: "success",
        data: {
            data: distances
        }
    })
});

// BUILDING QUERY
// 1a) Normal filtering
// const queryObj = {
//     ...req.query
// };
// const excludedFields = ["page", "sort", "limit", "fields"];
// excludedFields.forEach(el => delete queryObj[el]);

// // 1b) Advanced Filtering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

// // we can't await this query here because it will be impossible to chain our sorting and pagination methos on it after we've received the response
// let query = Tour.find(JSON.parse(queryStr));

// 2) Sorting
// if (req.query.sort) {
//     const sortBy = req.query.sort.split(",").join(" "); // sort("primary field secondary field"), separated by comma in url
//     query = query.sort(sortBy);

//     // for descending, put a minus sign in front of the field in the url 
// } else {
//     query = query.sort("-createdAt");
// }

// 3) Field limiting - Specify a number of field separated by a comma equal to fields
// if (req.query.fields) {
//     const fields = req.query.fields.split(",").join(" ");
//     query = query.select(fields);
// } else {
//     query = query.select("-__v");
// }

// 4) Pagination - Page can be specified with optional limit
// const page = +req.query.page || 1;
// const limit = +req.query.limit || 100;
// const skip = (page - 1) * limit;

// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//     const numTours = await Tour.countDocuments();
//     if (skip >= numTours)
//         throw new Error("Page cannot be found");
// }