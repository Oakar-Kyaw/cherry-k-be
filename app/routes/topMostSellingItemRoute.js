const TopMostSellingItems  = require("../controllers/topMostSellingItemController")
const { catchError } = require("../lib/errorHandler");
const verifyToken = require('../lib/verifyToken');

module.exports = (app)=>{
     app.route("/api/top-selling-items")
        .post(catchError(TopMostSellingItems.createTopMostSellingItems))

     app.route("/api/top-selling-item/accessory")
        .get(catchError(TopMostSellingItems.listAllAccessory))
      
     app.route("/api/top-selling-item/procedure")
        .get(catchError(TopMostSellingItems.listAllProcedure))
      
     app.route("/api/top-selling-item/accessory")
        .get(catchError(TopMostSellingItems.listAllMedicine))
   
      app.route("/api/top-selling-item/accessory")
        .get(catchError(TopMostSellingItems.listAllGeneral))
}