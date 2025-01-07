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
    // Fetch all confirmed TransferToHoRequests
    const transferRequests = await TransferToHoRequests.find({
      isConfirmed: true,
    });

    // Fetch logs where actualQty > 0 and not deleted
    const logs = await Logs.find({
      actualQty: { $gt: 0 },
      isDeleted: false,
    });

    // Fetch purchase requests with existing relatedApprove and not deleted
    const purchaseRequests = await PurchaseRequests.find({
      relatedApprove: { $exists: true },
      isDeleted: false,
    });

    // Initialize containers for matched quantities and item IDs
    const matchedQuantities = {
      transferToHoRequests: {
        medicineItems: [],
        procedureItems: [],
        accessoryItems: [],
        generalItems: [],
      },
      transferedQty: {
        medicineItems: [],
        procedureItems: [],
        accessoryItems: [],
        generalItems: [],
      },
      purchaseRequests: {
        medicineItems: [],
        procedureItems: [],
        accessoryItems: [],
        generalItems: [],
      },
      openingStock: {
        medicineItems: [],
        procedureItems: [],
        accessoryItems: [],
        generalItems: [],
      },
      closingStock: {
        medicineItems: [],
        procedureItems: [],
        accessoryItems: [],
        generalItems: [],
      },
    };

    // Extract all item IDs from the transfer requests and purchase requests
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
          request[type].forEach((item) => {
            if (item.item_id) {
              itemIds[type].push(item.item_id.toString());
            }
          });
        });
      });
    };

    addItemIds(transferRequests, itemIds);
    addItemIds(purchaseRequests, itemIds);

    // Fetch items from the respective collections and populate the required fields
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
          path: "name", // Assuming the `name` field references `generalUnits`
          select: "name",
        })
        .select("code currentQuantity name"),
    ]);

    // Create a lookup for valid item IDs from the database and capture quantities
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

    // Add opening and closing stock data
    const addStockData = (items, type) => {
      items.forEach(([itemId, { code, name, qty }]) => {
        matchedQuantities.openingStock[type].push({
          item_id: itemId,
          code,
          name,
          quantity: qty,
        });
        matchedQuantities.closingStock[type].push({
          item_id: itemId,
          code,
          name,
          quantity: qty,
        });
      });
    };

    addStockData(Array.from(validItems.medicineItems), "medicineItems");
    addStockData(Array.from(validItems.procedureItems), "procedureItems");
    addStockData(Array.from(validItems.accessoryItems), "accessoryItems");
    addStockData(Array.from(validItems.generalItems), "generalItems");

    // Aggregate quantities for transfer requests and purchase requests
    const aggregateQuantities = (requests, target) => {
      requests.forEach((request) => {
        [
          "medicineItems",
          "procedureItems",
          "accessoryItems",
          "generalItems",
        ].forEach((type) => {
          request[type].forEach((item) => {
            const itemId = item.item_id.toString();
            if (validItems[type].has(itemId)) {
              const existingItem = target[type].find(
                (existing) => existing.item_id === itemId
              );
              if (existingItem) {
                existingItem.qty += item.qty || item.requestedQty || 0;
              } else {
                const { code, name } = validItems[type].get(itemId);
                target[type].push({
                  item_id: itemId,
                  code,
                  name,
                  qty: item.qty || item.requestedQty || 0,
                });
              }
            }
          });
        });
      });
    };

    aggregateQuantities(
      transferRequests,
      matchedQuantities.transferToHoRequests
    );
    aggregateQuantities(purchaseRequests, matchedQuantities.purchaseRequests);

    // Aggregate actualQty from logs
    const aggregateLogs = (logs, type, field) => {
      logs.forEach((log) => {
        const itemId = log[field]?.toString();
        if (itemId && validItems[type].has(itemId)) {
          const existingItem = matchedQuantities.transferedQty[type].find(
            (existing) => existing.item_id === itemId
          );
          if (existingItem) {
            existingItem.actualQty += log.actualQty;
          } else {
            const { code, name } = validItems[type].get(itemId);
            matchedQuantities.transferedQty[type].push({
              item_id: itemId,
              code,
              name,
              actualQty: log.actualQty,
            });
          }
        }
      });
    };

    aggregateLogs(logs, "medicineItems", "relatedMedicineItems");
    aggregateLogs(logs, "procedureItems", "relatedProcedureItems");
    aggregateLogs(logs, "accessoryItems", "relatedAccessoryItems");
    aggregateLogs(logs, "generalItems", "relatedGeneralItems");

    // Send the matched results
    res.status(200).json({
      success: true,
      data: matchedQuantities,
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
