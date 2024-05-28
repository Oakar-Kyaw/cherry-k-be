const multer = require("multer")
const path = require("path")
//to upload store engine
const storage = multer.diskStorage({
 destination: function (req, file, cb){
    const filePath = path.join(process.cwd() + "/uploads"+"/cherry-k/"+file.fieldname)
    cb(null, filePath)
 },
 filename: function(req, file,cb){
     const fileName = Date.now()+  "-" + file.originalname 
     cb(null, fileName)
 }
})

const fileFilter = (req, file, cb) => {
     let fileTypes = /jpeg|jpg|png|gif/
     let mimeType = fileTypes.test(file.mimetype)
     let extName = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
     )
     if(mimeType || extName){
        cb(null, true)
     }
     else {
        cb("File is allowed only these types: " + fileTypes)
     }
}

//upload 
const upload = multer({
    storage: storage, 
    fileFilter: fileFilter,
    limits:{
        fileSize: 1024 * 1024 * 10
    }
})

module.exports = upload