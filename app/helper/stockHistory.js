const PurchaseModel = require("../models/purchase");
const StockModel = require("../models/stock");

const fetchPurchaseAndTransferByBranchID = async (relatedBranch) => {
  try {
    // Fetch stocks for the related branch
    const stocks = await StockModel.find({
      relatedBranch: relatedBranch,
      isDeleted: false,
    });

    if (!stocks || stocks.length === 0) {
      return { error: true, message: "No stock found for this branch" };
    }

    // Collect item IDs from the stocks
    const accessoryItemIds = stocks
      .map((stock) => stock.relatedAccessoryItems)
      .filter(Boolean)
      .flat(); // Flatten the array
    const procedureItemIds = stocks
      .map((stock) => stock.relatedProcedureItems)
      .filter(Boolean)
      .flat();
    const medicineItemIds = stocks
      .map((stock) => stock.relatedMedicineItems)
      .filter(Boolean)
      .flat();
    const generalItemIds = stocks
      .map((stock) => stock.relatedGeneralItems)
      .filter(Boolean)
      .flat();

    // Fetch purchases that match the item IDs from the stock
    const purchases = await PurchaseModel.find({
      $or: [
        { "accessoryItems.item_id": { $in: accessoryItemIds } },
        { "procedureItems.item_id": { $in: procedureItemIds } },
        { "medicineItems.item_id": { $in: medicineItemIds } },
        { "generalItems.item_id": { $in: generalItemIds } },
      ],
      isDeleted: false,
    });

    // Check if purchases exist
    if (!purchases || purchases.length === 0) {
      return {
        error: true,
        message: "No purchases found for the related items",
      };
    }

    // Format the purchases
    const formattedPurchases = purchases.map((purchase) => {
      return {
        purchaseId: purchase._id,
        purchaseDate: purchase.purchaseDate,

        accessoryItems: (purchase.accessoryItems || []).map((item) => {
          return {
            itemId: item.item_id,
            requestedQty: item.requestedQty,
            transferQty: item.transferQty,
            // No stockId here as we're not returning stock info
          };
        }),

        medicineItems: (purchase.medicineItems || []).map((item) => {
          return {
            itemId: item.item_id,
            requestedQty: item.requestedQty,
            transferQty: item.transferQty,
            // No stockId here as we're not returning stock info
          };
        }),

        procedureItems: (purchase.procedureItems || []).map((item) => {
          return {
            itemId: item.item_id,
            requestedQty: item.requestedQty,
            transferQty: item.transferQty,
            // No stockId here as we're not returning stock info
          };
        }),

        generalItems: (purchase.generalItems || []).map((item) => {
          return {
            itemId: item.item_id,
            requestedQty: item.requestedQty,
            transferQty: item.transferQty,
            // No stockId here as we're not returning stock info
          };
        }),
      };
    });

    return {
      relatedBranch,
      relatedPurchases: formattedPurchases,
    };
  } catch (error) {
    console.error("Error in fetchPurchaseAndTransferByBranchID:", error);
    return { error: true, message: error.message };
  }
};

module.exports = {
  fetchPurchaseAndTransferByBranchID,
};
