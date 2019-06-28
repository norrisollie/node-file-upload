const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const assert = require("assert");
const sizeOf = require("image-size");
const fs = require("fs");
const url = require("url");
const MongoClient = require("mongodb").MongoClient;
ObjectId = require("mongodb").ObjectId;
const mongodbUrl = "mongodb://localhost:27017";

let db;
const dbName = "image-db";

MongoClient.connect(mongodbUrl, (err, client) => {
    ObjectId = require("mongodb").ObjectId;

    assert.equal(null, err);

    db = client.db(dbName);

    console.log("Connected to DB successfully!");
});

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    }
});

const uploadSettings = multer({
    storage: storage,

    limits: {
        fileSize: 50 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname);

        if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {
            return cb(new Error("Only JPEGs or PNGs can be uploaded."));
        } else {
            cb(null, true);
        }
    }
});

const uploadImages = uploadSettings.array("images");

// upload route
// handles upload of files
app.post("/upload", (req, res) => {

    // console.log(req)

    uploadImages(req, res, err => {
        //if else statement
        if (err) {
            console.log("Error:", err.message);
        } else {
            // map array of uploaded files
            // create an object
            // get the path, dimensions (using a module)

            // console.log(req.body.projectname)

            const imagesArray = req.files.map(image => {
                const imageObject = {};

                imageObject.path = image.path.replace("public", "").replace(/\\/g, "/");

                const dimensions = sizeOf("public/" + imageObject.path);

                imageObject.width = dimensions.width;
                imageObject.height = dimensions.height;

                return imageObject;
            });

            const collectionName = req.body.projectname

            // add the object to the database
            db.collection("projects").insertMany(imagesArray, (err, result) => {
                if (err) {
                    console.log("Error:", err);
                } else {
                    console.log("Image added to the projects collection.");
                }
            });
        }
    });
    res.redirect("/");
});

app.get("/collections", (req, res) => {

    db.listCollections().toArray((err, collections) => {

        res.send(collections);

    })
})

// route to show uploaded images
app.get("/images", (req, res) => {
    // find collection
    db.collection("uploadtest2")
        .find()
        .toArray((err, images) => {
            // logs the contents of the database
            // console.log(images);

            // map through database to get images
            // return images individually
            const imagesInDatabase = images.map(image => {
                return image;
            });

            if (err) {
                console.log("Error:", err);
            }

            // console.log(imagesInDatabase)

            res.render("images", {
                images: imagesInDatabase,
                url: req.protocol + "://" + req.get("host")
            });
        });
});

// route to show the entries in database
app.get("/image-db", (req, res) => {
    db.collection("uploadtest2")
        .find()
        .toArray((err, images) => {
            if (err) {
                console.log("Error:", err);
            }
            res.send(images);
        });
});

app.get("/delete/:id", (req, res) => {

    const id = req.url.split("/")[2];

    console.log(id)

    db.collection("uploadtest2").deleteOne({ _id: ObjectId(id)}, (err, result) => {
        if(err) console.log(err)
        console.log(result)
    })
    res.redirect("/images")
});

// set static directory
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(port, () => {
    console.log("App is running on port", port);
});
