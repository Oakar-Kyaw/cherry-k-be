const StockHistoryController = require("../controllers/stockHistoryController");

module.exports = (app) => {
  app.route("/api/stocks/stock-history").post(async (req, res) => {
    try {
      await StockHistoryController.stockOpeningClosingHistory();
      res
        .status(200)
        .json({ message: "Stock history processed successfully." });
    } catch (error) {
      console.error("[POST /api/stocks/stock-history]:", error.message);
      res.status(500).json({ error: "Failed to process stock history." });
    }
  });
};
