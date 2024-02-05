const apiKey = require("../controllers/apiKeyController")
const { checkApiKey } = require("../lib/apiKeyHandler")

module.exports = (app) => {
    app.route("/api/api-key")
       .post(apiKey.createApiKey)
    //    .get(checkApiKey, apiKey.getApiKey)
    //    .put(checkApiKey)
}