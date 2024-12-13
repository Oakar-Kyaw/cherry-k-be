const schedule = require("node-schedule");
const StockHistoryModel = require("../models/stockHistory");
const BranchModel = require("../models/branch");

const updateDailyStockHistory = async () => {
  try {
    const branches = await BranchModel.find({ isDeleted: false });

    for (const branch of branches) {
      console.log(`Processing stock history for branch: ${branch._id}`);

      const stockHistories = await StockHistoryModel.find({
        relatedBranch: branch._id,
        isDeleted: false,
      });

      for (const stockHistory of stockHistories) {
        const { closingStock } = stockHistory;

        const updatedClosingStock = closingStock;

        stockHistory.closingStock = updatedClosingStock;
        await stockHistory.save();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const nextDayExists = await StockHistoryModel.findOne({
          relatedBranch: stockHistory.relatedBranch,
          relatedProcedureItems: stockHistory.relatedProcedureItems,
          relatedMedicineItems: stockHistory.relatedMedicineItems,
          relatedAccessoryItems: stockHistory.relatedAccessoryItems,
          relatedGeneralItems: stockHistory.relatedGeneralItems,
          createdAt: tomorrow,
        });

        if (!nextDayExists) {
          await StockHistoryModel.create({
            relatedBranch: stockHistory.relatedBranch,
            relatedProcedureItems: stockHistory.relatedProcedureItems,
            relatedMedicineItems: stockHistory.relatedMedicineItems,
            relatedAccessoryItems: stockHistory.relatedAccessoryItems,
            relatedGeneralItems: stockHistory.relatedGeneralItems,
            openingStock: updatedClosingStock,
            closingStock: updatedClosingStock,
            createdAt: tomorrow,
          });
        }
      }
    }

    console.log("Daily stock history update completed.");
  } catch (err) {
    console.error("Error updating daily stock history:", err.message);
    throw new Error("Failed to update daily stock history.");
  }
};

schedule.scheduleJob("0 0 * * *", updateDailyStockHistory);
