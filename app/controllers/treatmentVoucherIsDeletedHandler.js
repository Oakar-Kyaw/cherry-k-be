const TreatmentVoucherModel = require("../models/treatmentVoucher");
const TransactionModel = require("../models/transaction");
const MedicineItemModel = require("../models/medicineItem");
const MedicineItemsRecordModel = require("../models/medicineItemRecord");
const mongoose = require("mongoose");
const configMongo = require("../../config/db");

mongoose.connect(configMongo.db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function handleVoucherUpdate(voucherId) {
  try {
    // Find the voucher
    const result = await TreatmentVoucherModel.findById(voucherId);

    if (!result) {
      throw new Error("Voucher not found");
    }

    // Update the status to Cancelled
    result.status = "Canceled";
    await result.save();

    //Update related transactions
    const transactionsArr = result.relatedTransaction;
    if (transactionsArr.length > 0 && transactionsArr[0]) {
      await TransactionModel.updateMany(
        { _id: { $in: transactionsArr }, isDeleted: false },
        { $set: { isDeleted: true } }
      );
    }

    // Update medicine items and create restock records
    for (const saleItems of result.medicineItems) {
      const medicineItemDoc = await MedicineItemModel.findById(
        saleItems.item_id
      );

      if (medicineItemDoc) {
        medicineItemDoc.qty += saleItems.qty;
        await medicineItemDoc.save();

        const AfterDeleteRecord = await MedicineItemsRecordModel({
          medicineItems: [
            {
              RemoveItem_id: medicineItemDoc.item_id,
              addRemoveQtyBackToMedItems: saleItems.qty,
              ActualMedItemQtyAfterRemove: medicineItemDoc.currentQuantity,
            },
          ],
          relatedBranch: result.relatedBranch,
          reason: "Voucher Cancelled",
        });

        await AfterDeleteRecord.save();
      }
    }

    await MedicineItemsRecordModel.updateMany(
      { isDeleted: false },
      {
        relatedTreatment: result.relatedTreatment,
      }
    );
  } catch (error) {
    throw error;
  }
}

const startChangeStreams = () => {
  const changeStream = TreatmentVoucherModel.watch();

  changeStream.on("change", async (change) => {
    console.log("Change stream event: ", change);

    if (change.operationType === "update") {
      const updatedDocId = change.documentKey._id;
      await handleVoucherUpdate(updatedDocId);
    }
  });

  changeStream.on("error", (err) => {
    console.log("Change stream error: ", err);
  });
};

module.exports = {
  startChangeStreams,
};
