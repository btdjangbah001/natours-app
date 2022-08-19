const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const User = require("./userModel")

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        maxlength: [40, "A tour name must have at most 40 characters"],
        minlength: [10, "A tour name must have at least 10 characters"]
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, "A tour must have a duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a group size"]
    },
    difficulty: {
        type: String,
        required: [true, "A tour must hava a difficulty"],
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "Tour difficulty must be either easy, medium or dificult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Ratings must be from 1"],
        max: [5, "Ratings must be 5 or below"],
        set: val => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // The this keyword points to new doc only on doc creation
                return val < this.price;
            },
            message: "Discount price of ({val}) must be lower than the price of tour"
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, "A tour must have a summary"]
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: Boolean,
    startLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: [Number],
        address: "String",
        description: String,
    },
    locations: [{
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: [Number],
        address: "String",
        description: String,
        day: Number
    }],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: "User",
    }],
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
});

tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
});

tourSchema.virtual("reviews", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id"
});

tourSchema.index({
    price: 1,
    ratingsAverage: -1
});
tourSchema.index({
    slug: 1
});

tourSchema.index({
    startLocation: "2dsphere"
});

tourSchema.pre("save", function (next) {
    this.slug = slugify(this.name, {
        lower: true
    });
    next();
});

// This is way of embeding document is not the best because an time a guide changes his info, it must be updated in the 100s of tours heis found in also
// tourSchema.pre("save", async function (next) {
//     const guidesPromise = this.guides.map(async id => User.findById(id));
//     this.guides = await Promise.all(guidesPromise);

//     next();
// });

// tourSchema.post("save", function(doc, next){
//     console.log(doc);
//     next();
// });

tourSchema.pre(/^find/, function (next) {
    this.find({
        secretTour: {
            $ne: true
        }
    })
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt"
    });

    next();
})

tourSchema.post(/^find/, function (docs, next) {
    console.log(`This qurey took ${Date.now() - this.start} milliseconds long`);
    next();
});

// tourSchema.pre("aggregate", function (next) {
//     this.pipeline().unshift({
//         $match: {
//             secretTour: {
//                 $ne: true
//             }
//         }
//     })

//     next();
// })

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;