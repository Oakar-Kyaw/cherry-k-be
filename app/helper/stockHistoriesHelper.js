const schedule = require("node-schedule");
const { updateStockHistory } = require("../controllers/stockHistoryController");
const BranchModel = require("../models/branch");

const scheduleStockHistoryUpdate = async () => {
  try {
    schedule.scheduleJob("* * * * *", async () => {
      console.log("Starting stock history update...");

      try {
        const branches = await BranchModel.find();
        console.log(`Found ${branches.length} branches`);

        for (const branch of branches) {
          console.log(`Processing stock history for branch: ${branch._id}`);

          try {
            await updateStockHistory(branch._id);
            console.log(
              `Successfully updated stock history for branch ${branch._id}`
            );
          } catch (err) {
            console.error(
              `Error updating stock history for branch ${branch._id}:`,
              err
            );
          }
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }

      console.log("Stock history update completed.");
    });
  } catch (err) {
    console.error("Error scheduling stock history update:", err);
  }
};

module.exports = scheduleStockHistoryUpdate;
