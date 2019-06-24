const fs = require("fs")
const sharp = require("sharp")

module.exports = (path, format, width, height) => {
    
    sharp(path)
    .resize(width, height)
    .toFile("output.png", (err) => {

        console.log(err)

    })



        let transform = sharp()
    
        if(format) {
            transform = transform.toFormat(format)
        }
    
        if(width || height) {
            transform = transform.resize(width, height)
        }
    
        transform = transform.toFile('output.png', (err) => {
            console.log(err)
        })
}

