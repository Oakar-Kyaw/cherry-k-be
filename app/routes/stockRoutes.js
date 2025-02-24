"use strict";

const { verify } = require("crypto");
const stock = require("../controllers/stockController");
const { catchError } = require("../lib/errorHandler");
const verifyToken = require("../lib/verifyToken");

const { HeadOfficeStockHistory } = require("../HOStockHistory/stockHistoryHO");

module.exports = (app) => {
  app
    .route("/api/stock")
    .post(verifyToken, catchError(stock.createStock))
    .put(verifyToken, catchError(stock.updateStock));

  app
    .route("/api/stock/:id")
    .get(verifyToken, catchError(stock.getStock))
    .delete(verifyToken, catchError(stock.deleteStock))
    .post(verifyToken, catchError(stock.activateStock));

  app.route("/api/stocks").get(verifyToken, catchError(stock.listAllStocks));

  app.route("/api/stocks/copy").get(verifyToken, catchError(stock.copyStock));

  app.route("/api/stocks/branch").get(catchError(stock.getStockByBranchID));

  app
    .route("/api/stocks/reorder")
    .get(verifyToken, catchError(stock.checkReorder));

  app
    .route("/api/stocks/recieved")
    .put(verifyToken, catchError(stock.stockRecieved));

  app
    .route("/api/stocks/opening-closing/branch")
    .get(stock.stockOpeningClosingBranch);

  app.route("/api/stocks/calculate-stock").get(stock.CalculateAllStock);

  app.route("/api/stocks/stock-history").get(stock.getPurchaseStockHistory);

  app.route("/api/stocks/stock-history-ho").get(HeadOfficeStockHistory);

  app
    .route("/api/stocks/stock-history-branch")
    .get(stock.getStockHistoryByBranchID);
};
