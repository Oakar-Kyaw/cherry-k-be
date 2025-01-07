const mongoose = require("mongoose");
const MedicineItems = require("../models/medicineItem");
const ProcedureItems = require("../models/procedureItem");
const AccessoryItems = require("../models/accessoryItem");
const GeneralItems = require("../models/generalItem");
const GeneralUnits = require("../models/generalUnit"); // Assuming generalItems references generalUnits
const TransferToHoRequests = require("../models/transferToHoRequest");
const PurchaseRequests = require("../models/purchaseRequest");
const Logs = require("../models/log");

const HeadOfficeStockHistory = async (req, res) => {
  try {
    const transferRequests = await TransferToHoRequests.find({
      isConfirmed: true,
    });

    const logs = await Logs.find({
      actualQty: { $gt: 0 },
      isDeleted: false,
    });

    const purchaseRequests = await PurchaseRequests.find({
      relatedApprove: { $exists: true },
      isDeleted: false,
    });

    const itemIds = {
      medicineItems: [],
      procedureItems: [],
      accessoryItems: [],
      generalItems: [],
    };

    const addItemIds = (requests, itemIds) => {
      requests.forEach((request) => {
        [
          "medicineItems",
          "procedureItems",
          "accessoryItems",
          "generalItems",
        ].forEach((type) => {
          request[type]?.forEach((item) => {
            if (item.item_id) {
              itemIds[type].push(item.item_id.toString());
            }
          });
        });
      });
    };

    addItemIds(transferRequests, itemIds);
    addItemIds(purchaseRequests, itemIds);

    const [medicines, procedures, accessories, generals] = await Promise.all([
      MedicineItems.find({ _id: { $in: itemIds.medicineItems } }).select(
        "code medicineItemName currentQuantity"
      ),
      ProcedureItems.find({ _id: { $in: itemIds.procedureItems } }).select(
        "code procedureItemName currentQuantity"
      ),
      AccessoryItems.find({ _id: { $in: itemIds.accessoryItems } }).select(
        "code accessoryItemName currentQuantity"
      ),
      GeneralItems.find({ _id: { $in: itemIds.generalItems } })
        .populate({
          path: "name",
          select: "name",
        })
        .select("code currentQuantity name"),
    ]);

    const validItems = {
      medicineItems: new Map(
        medicines.map((item) => [
          item._id.toString(),
          {
            code: item.code,
            name: item.medicineItemName,
            qty: item.currentQuantity,
          },
        ])
      ),
      procedureItems: new Map(
        procedures.map((item) => [
          item._id.toString(),
          {
            code: item.code,
            name: item.procedureItemName,
            qty: item.currentQuantity,
          },
        ])
      ),
      accessoryItems: new Map(
        accessories.map((item) => [
          item._id.toString(),
          {
            code: item.code,
            name: item.accessoryItemName,
            qty: item.currentQuantity,
          },
        ])
      ),
      generalItems: new Map(
        generals.map((item) => [
          item._id.toString(),
          {
            code: item.code,
            name: item.name?.name || "",
            qty: item.currentQuantity,
          },
        ])
      ),
    };

    const finalData = {
      medicineItems: [],
      procedureItems: [],
      accessoryItems: [],
      generalItems: [],
    };

    const aggregateData = (requests, type, field) => {
      const tempData = new Map();

      requests.forEach((request) => {
        request[type]?.forEach((item) => {
          const itemId = item.item_id.toString();
          if (validItems[type].has(itemId)) {
            if (!tempData.has(itemId)) {
              const { code, name } = validItems[type].get(itemId);
              tempData.set(itemId, {
                item_id: itemId,
                code,
                name,
                openingQty: 0,
                closingQty: 0,
                transferToHoRequest: 0,
                transferedQty: 0,
                purchaseRequest: 0,
              });
            }
            const dataItem = tempData.get(itemId);
            dataItem[field] += item.qty || item.requestedQty || 0;
          }
        });
      });

      return Array.from(tempData.values());
    };

    finalData.medicineItems = aggregateData(
      transferRequests,
      "medicineItems",
      "transferToHoRequest"
    );
    finalData.procedureItems = aggregateData(
      transferRequests,
      "procedureItems",
      "transferToHoRequest"
    );
    finalData.accessoryItems = aggregateData(
      transferRequests,
      "accessoryItems",
      "transferToHoRequest"
    );
    finalData.generalItems = aggregateData(
      transferRequests,
      "generalItems",
      "transferToHoRequest"
    );

    logs.forEach((log) => {
      const typeMapping = {
        relatedMedicineItems: "medicineItems",
        relatedProcedureItems: "procedureItems",
        relatedAccessoryItems: "accessoryItems",
        relatedGeneralItems: "generalItems",
      };

      Object.entries(typeMapping).forEach(([field, type]) => {
        const itemId = log[field]?.toString();
        if (itemId && validItems[type].has(itemId)) {
          const { code, name } = validItems[type].get(itemId);
          finalData[type].push({
            item_id: itemId,
            code,
            name,
            openingQty: validItems[type].get(itemId).qty,
            closingQty: validItems[type].get(itemId).qty,
            transferToHoRequest: 0,
            transferedQty: log.actualQty,
            purchaseRequest: 0,
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    console.error("Error in HeadOfficeStockHistory:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching head office stock history.",
      error: error.message,
    });
  }
};

module.exports = { HeadOfficeStockHistory };
