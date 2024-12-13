const UsageModel = require("../models/usage");
const TreatmentVoucherModel = require("../models/treatmentVoucher");
const AccessoryItemRecordModel = require("../models/accessoryItemRecord");
const ProcedureItemRecordModel = require("../models/procedureItemRecord");
const GeneralItemRecordModel = require("../models/generalItemRecord");
const MedicineItemRecordModel = require("../models/medicineItemRecord");
const TransferToHosModel = require("../models/transferToHoRecord");
const RecievedRecordModel = require("../models/recievedRecord");
const StockHistoryModel = require("../models/stockHistory");

const stockHistoryBranch = async (branchID) => {
  if (!branchID) {
    throw new Error("Invalid branchID");
  }

  try {
    const extractSalesData = (data, key) =>
      data.reduce((acc, usage) => {
        usage[key].forEach((item) => {
          if (item.actual) {
            acc.push({
              item_id: item.item_id,
              treatmentSale: item.actual,
            });
          }
        });
        return acc;
      }, []);

    const consolidateByItemId = (array, qtyKey) => {
      return array.reduce((acc, item) => {
        const existingItem = acc.find(
          (el) => String(el.item_id) === String(item.item_id)
        );

        if (existingItem) {
          existingItem[qtyKey] += item[qtyKey];
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, []);
    };

    const usages = await UsageModel.find({
      relatedBranch: branchID,
      isDeleted: false,
    });

    const procedureMedicineSales = consolidateByItemId(
      extractSalesData(usages, "procedureMedicine"),
      "treatmentSale"
    );

    const procedureAccessorySales = consolidateByItemId(
      extractSalesData(usages, "procedureAccessory"),
      "treatmentSale"
    );

    const generalItemSales = consolidateByItemId(
      extractSalesData(usages, "generalItem"),
      "treatmentSale"
    );

    const treatmentVoucherDocs = await TreatmentVoucherModel.find({
      tsType: "MS",
      relatedBranch: branchID,
      isDeleted: false,
    });

    const medicineSales = consolidateByItemId(
      treatmentVoucherDocs.flatMap((doc) =>
        doc.medicineItems.map((item) => ({
          item_id: item.item_id,
          medicineSale: item.qty,
        }))
      ),
      "medicineSale"
    );

    const extractIssuedItems = async (model, key) => {
      const docs = await model.find({
        relatedBranch: branchID,
        isDeleted: false,
      });

      return consolidateByItemId(
        docs.flatMap((doc) =>
          doc[key].map((item) => ({
            item_id: item.item_id,
            issue: item.qty,
          }))
        ),
        "issue"
      );
    };

    const [
      accessoryIssues,
      procedureItemIssues,
      generalItemIssues,
      medicineItemIssues,
    ] = await Promise.all([
      extractIssuedItems(AccessoryItemRecordModel, "accessoryItems"),
      extractIssuedItems(ProcedureItemRecordModel, "procedureItems"),
      extractIssuedItems(GeneralItemRecordModel, "generalItems"),
      extractIssuedItems(MedicineItemRecordModel, "medicineItems"),
    ]);

    const transferToHoDocs = await TransferToHosModel.find({
      relatedBranch: branchID,
      isDeleted: false,
    });

    const extractTransferData = (docs, key) =>
      consolidateByItemId(
        docs.flatMap((doc) =>
          doc[key].map((item) => ({
            item_id: item.item_id,
            transferQty: item.qty,
          }))
        ),
        "transferQty"
      );

    const transferToHo = {
      procedureItems: extractTransferData(transferToHoDocs, "procedureItems"),
      accessoryItems: extractTransferData(transferToHoDocs, "accessoryItems"),
      medicineItems: extractTransferData(transferToHoDocs, "medicineItems"),
      generalItems: extractTransferData(transferToHoDocs, "generalItems"),
    };

    const recievedRecords = await RecievedRecordModel.find({
      relatedBranch: branchID,
      isDeleted: false,
    });

    const mapRecievedItems = (records, key) =>
      consolidateByItemId(
        records
          .filter((record) => record[key])
          .map((record) => ({
            item_id: record[key],
            recievedQty: record.recievedQty,
          })),
        "recievedQty"
      );

    const receivedItems = {
      procedureItems: mapRecievedItems(
        recievedRecords,
        "relatedProcedureItems"
      ),
      accessoryItems: mapRecievedItems(
        recievedRecords,
        "relatedAccessoryItems"
      ),
      medicineItems: mapRecievedItems(recievedRecords, "relatedMedicineItems"),
      generalItems: mapRecievedItems(recievedRecords, "relatedGeneralItems"),
    };

    const stockHistories = await StockHistoryModel.find({
      relatedBranch: branchID,
      isDeleted: false,
    });

    const mapStockItems = (records, key) =>
      consolidateByItemId(
        records
          .filter((record) => record[key])
          .map((record) => ({
            item_id: record[key],
            openingStock: record.openingStock,
            closingStock: record.closingStock,
          })),
        "openingStock"
      );

    const stockOpeningClosing = {
      procedureItems: mapStockItems(stockHistories, "relatedProcedureItems"),
      accessoryItems: mapStockItems(stockHistories, "relatedAccessoryItems"),
      medicineItems: mapStockItems(stockHistories, "relatedMedicineItems"),
      generalItems: mapStockItems(stockHistories, "relatedGeneralItems"),
    };

    return {
      treatmentSales: {
        procedureMedicineItems: procedureMedicineSales,
        procedureAccessoryItems: procedureAccessorySales,
        generalItems: generalItemSales,
        medicineItems: medicineSales,
      },
      issuedItems: {
        accessoryItems: accessoryIssues,
        procedureItems: procedureItemIssues,
        generalItems: generalItemIssues,
        medicineItems: medicineItemIssues,
      },
      transferToHo,
      receivedItems,
      stockOpeningClosing,
    };
  } catch (err) {
    console.error("Error in stockHistoryBranch:", err.message);
    throw new Error("Failed to fetch stock history for the branch");
  }
};

module.exports = {
  stockHistoryBranch,
};
