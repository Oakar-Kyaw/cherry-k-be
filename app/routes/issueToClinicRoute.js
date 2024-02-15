
const IssueToClinic = require("../controllers/issueToClinicController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")


module.exports = (app) => {
    app.route('/api/items/issue-to-clinic').post( verifyToken,catchError(IssueToClinic.issueToClinic))
}
//