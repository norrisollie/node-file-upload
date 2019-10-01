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
    ObjectId = require("mongodb").ObjectId

    assert.equal(null, err)

    db = client.db(dbName)

    console.log("Connected to DB successfully!")
});

const app = express()
const port = 3000

app.set("view engine", "ejs")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads")
    },
    filename: (req, file, cb) => {
        console.log(file)

        cb(
            null,
            Date.now() + "-" + file.originalname
        );
    }
});

const uploadSettings = multer({
    storage: storage,

    limits: {
        fileSize: 50 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname)

        if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {
            return cb(new Error("Only JPEGs or PNGs can be uploaded."))
        } else {
            cb(null, true);
        }
    }
});

const projectName = uploadSettings.none()

const uploadImages = uploadSettings.any()

// upload route
// handles upload of files
app.post("/upload", (req, res) => {

    let projectNames

    // projectName(req, res, err => {
    //     projectNames = req.body
    //     console.log(projectNames)

        uploadImages(req, res, err => {

            if(err) console.log("Error:", err)

            console.log(req.files)

        })

    // })

    console.log("RETURNED: " + projectNames)



    // uploadImages(req, res, err => {

    //     console.log(req.body.projectname)

    // })

    // console.log(projectName)

    // db.collection("projects").findOne({ "projectname": { $exists: true } }, (err, result) => {
        
        
    //     if(result === null || projectName !== result.projectname) {

    //         uploadImages((req, res, err) => {

    //             if(err) console.log("Error:", err)

    //             const imagesArray = req.files.map(image => {
                
    //                 const imageObject = {}

    //                 imageObject.path = image.path.replace("public", "").replace(/\\/g, "/")
    //                 const dimensions = sizeOf("public/" + imageObject.path)

    //                 imageObject.originalname = image.originalname.split(".")[0]
    //                 imageObject.filename = image.filename
    //                 imageObject.width = dimensions.width
    //                 imageObject.height = dimensions.height
    
    //                 return imageObject;

    //             })

    //             const projectObject = {};
    //             projectObject.projectname = projectName
    //             projectObject.projectImages = imagesArray
                
    //             const projectArray = [];
    //             projectArray.push(projectObject)

    //             db.collection("projects").insertMany(projectArray, (err, result) => {

    //                 if (err) {
    //                     console.log("Error:", err);
    //                 } else {
    //                     console.log("Image added to the projects collection.")
    //                 }

    //             })

    //         })

    //     } else {

    //         console.log("Project name already exists in database, choose another name.")

    //     }

    //     res.redirect("/");

    // })
})

// // upload route
// // handles upload of files
// app.post("/upload", (req, res) => {
//     // console.log(req)

//     uploadImages(req, res, err => {
//         //if else statement
//         if (err) {
//             console.log("Error:", err.message)
//         } else {

//             const imagesArray = req.files.map(image => {

//                 const imageObject = {}
                
//                 imageObject.path = image.path.replace("public", "").replace(/\\/g, "/")
//                 const dimensions = sizeOf("public/" + imageObject.path)

//                 imageObject.originalname = image.originalname.split(".")[0]
//                 imageObject.filename = image.filename
//                 imageObject.width = dimensions.width
//                 imageObject.height = dimensions.height

//                 return imageObject;

//             });

//             const projectName = req.body.projectname;
            
//             projectObject = {};
//             projectObject.projectname = projectName
//             projectObject.projectImages = imagesArray
            
//             const projectArray = [];
//             projectArray.push(projectObject)

//             db.collection("projects").findOne({ "projectname": { $exists: true } }, (err, result) => {

//                 if(result === null || projectName !== result.projectname) {

//                     db.collection("projects").insertMany(projectArray, (err, result) => {

//                         if (err) {
//                             console.log("Error:", err);
//                         } else {
//                             console.log("Image added to the projects collection.")
//                         }

//                     })

//                 } else {
//                     console.log("Project name already exists in database, choose another name.")
//                 }
//             })
//         }
//     })
//     res.redirect("/");
// })

app.get("/collections", (req, res) => {
    db.listCollections().toArray((err, collections) => {
        res.send(collections)
    })
})

// route to show uploaded images
app.get("/allprojects", (req, res) => {
    // find collection
    db.collection("projects").find().toArray((err, projects) => {

            if (err) console.log(err);

            const projectsInDatabase = projects.map(project => {

                return project;

            });

            res.render("projects", {
                projects: projectsInDatabase,
                url: req.protocol + "://" + req.get("host")
            });
        });
});

// route to show the entries in database
app.get("/projects", (req, res) => {

    db.collection("projects").find().toArray((err, images) => {

            if (err) {

                console.log("Error:", err)

            }

            res.send(images)
        
        })
})

app.get("/delete/:id/:originalname", (req, res) => {

    const id = req.url.split("/")[2];
    const originalname = req.url.split("/")[3];

    db.collection("projects").findOne(
        { _id: ObjectId(id) }, (err, result) => {

            for(let i = 0; i < result.projectImages.length; i++) {

                if(result.projectImages[i].originalname === originalname) {

                    const filename = result.projectImages[i].filename
                    const path = result.projectImages[i].path
                    const originalname = result.projectImages[i].originalname

                    fs.unlink(__dirname + "/public" + path, (err) => {
                        if(err) console.log("Error:", err)
                        console.log("Deleted:", __dirname + "/public" + path)
                    })

                }
            }
        })

    db.collection("projects").updateOne(
        { _id: ObjectId(id) },
        { $pull: { projectImages: { originalname } } }, (err) =>{
            if(err) console.log(err)
            console.log(req.params)
        }
    );
    res.redirect("/allprojects");
});

// set static directory
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(port, () => {
    console.log("App is running on port", port);
});
