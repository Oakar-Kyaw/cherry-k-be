const mongoose = require("mongoose");
mongoose.promise = global.Promise
const Schema = mongoose.Schema

const apiKeySchema = new Schema({
    apiKey: {
        type: String,
        require: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const apiKey = new mongoose.model("ApiKeies", apiKeySchema)
module.exports = apiKey