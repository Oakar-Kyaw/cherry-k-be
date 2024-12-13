const StockModel = require("../models/stock");
const StockHistoryModel = require("../models/stockHistory");
const TreatmentVoucherModel = require("../models/treatmentVoucher");
const AccessoryItemRecordmodel = require("../models/accessoryItemRecord");
const ProcedureItemRecordModel = require("../models/procedureItemRecord");
const GeneralItemRecordModel = require("../models/generalItemRecord");
const MedicineItemRecordModel = require("../models/medicineItemRecord");
const TransferToHosModel = require("../models/transferToHoRecord");
const UsageModel = require("../models/usage");

const stockOpeningClosingHistory = async () => {
  console.log("start running stockOpeningClosingHistory");
  try {
    const stocks = await StockModel.find({
      isDeleted: false,
    })
      .select(
        "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedGeneralItems currentQty"
      )
      .lean();

    const existingHistories = await StockHistoryModel.find({
      relatedBranch: {
        $in: [...new Set(stocks.map((stock) => stock.relatedBranch))],
      },
      isDeleted: false,
    })
      .select(
        "relatedBranch relatedProcedureItems relatedMedicineItems relatedAccessoryItems relatedGeneralItems"
      )
      .lean();

    // Create a map of existing history for faster comparison
    const existingHistoryMap = existingHistories.reduce((acc, history) => {
      const key = `${history.relatedBranch}-${
        history.relatedProcedureItems || ""
      }-${history.relatedMedicineItems || ""}-${
        history.relatedAccessoryItems || ""
      }-${history.relatedGeneralItems || ""}`;
      acc[key] = true;
      return acc;
    }, {});

    const bulkOps = [];

    for (const stock of stocks) {
      // Generate a unique key based on the stock's related items (for comparison)
      const key = `${stock.relatedBranch}-${
        stock.relatedProcedureItems || ""
      }-${stock.relatedMedicineItems || ""}-${
        stock.relatedAccessoryItems || ""
      }-${stock.relatedGeneralItems || ""}`;

      // If no existing history, prepare the bulk operation for insertion
      if (!existingHistoryMap[key]) {
        bulkOps.push({
          insertOne: {
            document: {
              relatedBranch: stock.relatedBranch,
              relatedProcedureItems: stock.relatedProcedureItems,
              relatedMedicineItems: stock.relatedMedicineItems,
              relatedAccessoryItems: stock.relatedAccessoryItems,
              relatedGeneralItems: stock.relatedGeneralItems,
              openingStock: stock.currentQty,
              closingStock: stock.currentQty,
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await StockHistoryModel.bulkWrite(bulkOps);
      console.log("Stock history records created in bulk.");
    } else {
      console.log("No new stock history records to create.");
    }
  } catch (err) {
    console.error("[stockOpeningClosingHistory] Error:", err);
    throw new Error("Failed to process stock history.");
  }
};

const updateStockHistory = async (branchID) => {
  try {
    const extractSalesData = (data, key) =>
      data.reduce((acc, usage) => {
        usage[key]?.forEach((item) => {
          try {
            if (item.actual != null && typeof item.actual === "number") {
              acc.push({
                item_id: item.item_id,
                qty: item.actual,
              });
            } else {
              console.warn(`Skipping item with invalid actual value:`, item);
            }
          } catch (err) {
            console.error(`Error processing item: ${item}`, err);
          }
        });
        return acc;
      }, []);

    const getStockHistory = async (item_id, relatedField, branchID) => {
      return StockHistoryModel.findOne({
        relatedBranch: branchID,
        [relatedField]: item_id,
      });
    };

    const processStockChange = async (
      items,
      relatedField,
      isDecrement = true
    ) => {
      for (const item of items) {
        const { item_id, qty } = item;

        if (typeof qty !== "number" || isNaN(qty)) {
          console.error(`Invalid quantity for item ${item_id}:`, qty);
          continue;
        }

        const stockHistory = await getStockHistory(
          item_id,
          relatedField,
          branchID
        );

        if (stockHistory) {
          const updatedClosingStock = isDecrement
            ? stockHistory.closingStock - qty
            : stockHistory.closingStock + qty;

          await StockHistoryModel.updateOne(
            { _id: stockHistory._id },
            {
              $set: { closingStock: updatedClosingStock },
              $inc: { openingStock: qty },
            }
          );
        } else {
          await StockHistoryModel.create({
            relatedBranch: branchID,
            [relatedField]: item_id,
            openingStock: isDecrement ? -qty : qty,
            closingStock: isDecrement ? -qty : qty,
          });
        }
      }
    };

    const usages = await UsageModel.find({
      relatedBranch: branchID,
      isDeleted: false,
    });

    const procedureMedicineSales = extractSalesData(
      usages,
      "procedureMedicine"
    );

    const procedureAccessorySales = extractSalesData(
      usages,
      "procedureAccessory"
    );

    const generalItemSales = extractSalesData(usages, "generalItem");

    const treatmentVoucherDocs = await TreatmentVoucherModel.find({
      tsType: "MS",
      relatedBranch: branchID,
      isDeleted: false,
    });

    const medicineSales = treatmentVoucherDocs.flatMap((doc) =>
      doc.medicineItems.map((item) => ({
        item_id: item.item_id,
        qty: item.qty,
      }))
    );

    const extractIssuedItems = async (model, key) => {
      const docs = await model.find({
        relatedBranch: branchID,
        isDeleted: false,
      });

      return docs.flatMap((doc) =>
        doc[key].map((item) => ({
          item_id: item.item_id,
          qty: item.qty,
        }))
      );
    };

    const [
      accessoryIssues,
      procedureItemIssues,
      generalItemIssues,
      medicineItemIssues,
    ] = await Promise.all([
      extractIssuedItems(AccessoryItemRecordmodel, "accessoryItems"),
      extractIssuedItems(ProcedureItemRecordModel, "procedureItems"),
      extractIssuedItems(GeneralItemRecordModel, "generalItems"),
      extractIssuedItems(MedicineItemRecordModel, "medicineItems"),
    ]);

    const transferToHoDocs = await TransferToHosModel.find({
      relatedBranch: branchID,
      isDeleted: false,
    });

    const transferToHo = {
      procedureItems: extractSalesData(transferToHoDocs, "procedureItems"),
      accessoryItems: extractSalesData(transferToHoDocs, "accessoryItems"),
      medicineItems: extractSalesData(transferToHoDocs, "medicineItems"),
      generalItems: extractSalesData(transferToHoDocs, "generalItems"),
    };

    await Promise.all([
      processStockChange(
        procedureMedicineSales,
        "relatedProcedureItems",
        true
      ).catch((err) => {
        console.error("Error in updating procedure medicine sales:", err);
      }),

      processStockChange(
        procedureAccessorySales,
        "relatedAccessoryItems",
        true
      ).catch((err) => {
        console.error("Error in updating procedure accessory sales:", err);
      }),

      processStockChange(generalItemSales, "relatedGeneralItems", true).catch(
        (err) => {
          console.error("Error in updating general item sales:", err);
        }
      ),

      processStockChange(medicineSales, "relatedMedicineItems", true).catch(
        (err) => {
          console.error("Error in updating medicine sales:", err);
        }
      ),

      processStockChange(accessoryIssues, "relatedAccessoryItems", true).catch(
        (err) => {
          console.error("Error in updating accessory issues:", err);
        }
      ),

      processStockChange(
        procedureItemIssues,
        "relatedProcedureItems",
        true
      ).catch((err) => {
        console.error("Error in updating procedure issues:", err);
      }),

      processStockChange(generalItemIssues, "relatedGeneralItems", true).catch(
        (err) => {
          console.error("Error in updating general item issues:", err);
        }
      ),

      processStockChange(
        medicineItemIssues,
        "relatedMedicineItems",
        true
      ).catch((err) => {
        console.error("Error in updating medicine issues:", err);
      }),

      processStockChange(
        transferToHo.procedureItems,
        "relatedProcedureItems",
        false
      ).catch((err) => {
        console.error("Error in updating transfer to HO procedure items:", err);
      }),

      processStockChange(
        transferToHo.accessoryItems,
        "relatedAccessoryItems",
        false
      ).catch((err) => {
        console.error("Error in updating transfer to HO accessory items:", err);
      }),

      processStockChange(
        transferToHo.medicineItems,
        "relatedMedicineItems",
        false
      ).catch((err) => {
        console.error("Error in updating transfer to HO medicine items:", err);
      }),

      processStockChange(
        transferToHo.generalItems,
        "relatedGeneralItems",
        false
      ).catch((err) => {
        console.error("Error in updating transfer to HO general items:", err);
      }),
    ]);

    console.log(`Stock history updated for branch: ${branchID}`);
  } catch (err) {
    console.error("Error in updating stock history:", err);
    throw new Error("Failed to update stock history.");
  }
};

module.exports = { stockOpeningClosingHistory, updateStockHistory };
