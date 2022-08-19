const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
    console.log("Something bad is going on, shutting down...");
    console.log(err);
    process.exit(1);
});

dotenv.config({
    path: "./config.env"
});
const app = require("./app");

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
}).then(() => console.log("Database connected succesfully"));

const server = app.listen(process.env.PORT, () => {
    console.log(`App is running on port ${process.env.PORT}`);
});

process.on("unhandledRejection", (err) => {
    console.log("Something bad is happening with the server, shutting down...");
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});