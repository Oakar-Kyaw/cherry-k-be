const DismissItemFromHo  = require("../controllers/dismissItemFromHoController")
const { catchError } = require("../lib/errorHandler")
const verifyToken = require("../lib/verifyToken")


module.exports = (app) => {
    app.route("/api/dismiss/items")
       .post(verifyToken, catchError(DismissItemFromHo.createDismissItemFromHo))
       .get(verifyToken, catchError(DismissItemFromHo.listAllDismissItemFromHo))
    //dismiss items from ho by id
    app.route("/api/dismiss/item/:id")
       .get(verifyToken, catchError(DismissItemFromHo.getDismissItemFromHoCode))
       .put(verifyToken, catchError(DismissItemFromHo.updateDismissItemFromHoById))
       .delete(verifyToken, catchError(DismissItemFromHo.deleteDismissItemFromHoById))
   
   //dismiss item's code
   app.route("/api/dismiss/items/get-code")
      .get(catchError(verifyToken,DismissItemFromHo.getDismissItemFromHoCode))
}