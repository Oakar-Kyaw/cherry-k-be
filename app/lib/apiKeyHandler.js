const ApiKey = require("../models/apiKey")

exports.checkApiKey = async (req,res,next) => {
    let data = await ApiKey.find()
    let apiKey = data[0].apiKey
    apiKey === req.headers["x-api-key"] ?
        next()
        : res.status(500).send({
            error:true,
            message: "API Key Error"
        })
}