const express = require("express")
const bodyParser = require("body-parser")
const multer = require("multer")
const path = require("path")
const assert = require("assert")
const sizeOf = require("image-size")
const fs = require("fs")
const MongoClient = require('mongodb').MongoClient
ObjectId = require('mongodb').ObjectId
const mongodbUrl = "mongodb://localhost:27017"
const resize = require('./resize')

let db
const dbName = "image-db"

MongoClient.connect(mongodbUrl, (err, client) => {

    ObjectId = require('mongodb').ObjectId

    assert.equal(null, err)

    db = client.db(dbName)

    console.log("Connected to DB successfully!")

    // client.close()

})

const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads")
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})

const uploadSettings = multer({

    storage: storage,

    limits: {

        fileSize: 50 * 1024 * 1024

    },

    fileFilter: (req, file, cb) => {

        const extension = path.extname(file.originalname)

        if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {

            return cb(new Error('Only JPEGs or PNGs can be uploaded.'))

        } else {

            cb(null, true)

        }
    }
})

const uploadImages = uploadSettings.array("images");

// upload files route, handles form 
app.post("/upload", (req, res) => {

    uploadImages(req, res, (err) => {
        if (err) {

            console.log("Error:", err.message)

        } else {

            const imagesArray = req.files.map((image) => {

                var imageObject = {}

                imageObject.path = image.path.replace("public", "").replace(/\\/g, "/")

                
                sizeOf("public/" + imageObject.path, function (err, dimensions) {
                    if (err) {
                        console.log(err)
                    }else{
                        imageObject.width = dimensions.width
                        imageObject.height = dimensions.height
                    }
                    return imageObject
                  });
                  console.log(imageObject)
            return imageObject
                
            })

            console.log(imagesArray)
            
            db.collection("uploadtest2").insertMany(imagesArray, (err, result) => {

                if (err) {
                    return console.log(err)
                }

                // db.collection("resized-images").insertMany()

                console.log("something saved to the database")

            })

        }
    })

    res.redirect("/")
})

app.get("/images", (req, res) => {

    db.collection('images').find().toArray((err, result) => {

        const imageArray = result.map((image) => {
            return image
        })

        if (err) {
            return cb(new Error(err))
        }

        res.render("images", {
            images: imageArray,
            url: req.protocol + "://" + req.get("host"),
        })

    })

})

app.get("/collection", (req, res) => {

    db.collection('u').find().toArray((err, result) => {
        
        res.send(result)

    })
});

// set static directory
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render("index");
})

app.listen(port, () => {
    console.log("App is running on port", port)
})