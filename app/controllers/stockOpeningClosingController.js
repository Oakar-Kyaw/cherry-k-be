"use strict";

const stock = require("../models/stock");
const purchaseRequestModel = require("../models/purchaseRequest");
const { ObjectId } = require("mongodb");

// This is for branches
exports.getStockSummaryByQty = async (req, res, next) => {
  const { skip = 1, limit = 20, relatedBranch } = req.query;

  let count = 0;
  let page = 0;

  let StockModelMatch = {
    $or: [
      { finalQty: { $gt: 0 } },
      { currentQty: { $gt: 0 } },
      { totalUnit: { $gt: 0 } },
      { reOrderQuantity: { $gt: 0 } },
      { fromUnit: { $gt: 0 } },
      { toUnit: { $gt: 0 } },
    ],
    isDeleted: false,
  };

  if (relatedBranch) {
    StockModelMatch.relatedBranch = ObjectId(relatedBranch);
  }

  const pageDivision = count / limit;
  page = Math.ceil(pageDivision);

  try {
    const stockSummary = await stock.aggregate([
      // Step 1: Initial Filter
      {
        $match: StockModelMatch,
      },

      // Step 2: Lookup related data
      {
        $lookup: {
          from: "branches",
          localField: "relatedBranch",
          foreignField: "_id",
          as: "relatedBranches",
        },
      },
      {
        $lookup: {
          from: "procedureitems",
          localField: "relatedProcedureItems",
          foreignField: "_id",
          as: "relatedProcedureItemsData",
        },
      },
      {
        $lookup: {
          from: "medicineitems",
          localField: "relatedMedicineItems",
          foreignField: "_id",
          as: "relatedMedicineItemsData",
        },
      },

      {
        $unwind: { path: "$relatedBranches", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: {
          path: "$relatedMedicineItemsData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$relatedProcedureItemsData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Step 3: Aggregate quantities from Usages
      {
        $lookup: {
          from: "usages",
          let: { itemId: "$_id" },
          pipeline: [
            { $unwind: "$procedureMedicine" },
            { $unwind: "$procedureAccessory" },
            { $unwind: "$generalItem" },
            { $unwind: "$machine" },
            { $unwind: "$procedureItemsError" },
            { $unwind: "$accessoryItemsError" },
            { $unwind: "$generalItemsError" },
            { $unwind: "$noProcedureItemsStock" },
            { $unwind: "$noAccessoryItemsStock" },
            { $unwind: "$noGeneralItemsStock" },
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$procedureMedicine.item_id", "$$itemId"] },
                    { $eq: ["$procedureAccessory.item_id", "$$itemId"] },
                    { $eq: ["$generalItem.item_id", "$$itemId"] },
                    { $eq: ["$machine.item_id", "$$itemId"] },
                    { $eq: ["$procedureItemsError.item_id", "$$itemId"] },
                    { $eq: ["$accessoryItemsError.item_id", "$$itemId"] },
                    { $eq: ["$generalItemsError.item_id", "$$itemId"] },
                    { $eq: ["$noProcedureItemsStock.item_id", "$$itemId"] },
                    { $eq: ["$noAccessoryItemsStock.item_id", "$$itemId"] },
                    { $eq: ["$noGeneralItemsStock.item_id", "$$itemId"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$_id",
                totalUsage: { $sum: "$quantity" },
              },
            },
          ],
          as: "usageData",
        },
      },

      // Step 4: Aggregate quantities from Medicine Sales
      {
        $lookup: {
          from: "medicineSales",
          let: { itemId: "$_id" },
          pipeline: [
            { $unwind: "$medicineItems" },
            {
              $match: {
                $expr: { $eq: ["$medicineItems.item_id", "$$itemId"] },
              },
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$medicineItems.quantity" },
              },
            },
          ],
          as: "medicineSalesData",
        },
      },

      // Step 5: Aggregate quantities from Transfers to Head Office
      {
        $lookup: {
          from: "transferToHos",
          let: { itemId: "$_id" },
          pipeline: [
            { $unwind: "$medicineItems" },
            {
              $match: {
                $expr: { $eq: ["$medicineItems.item_id", "$$itemId"] },
              },
            },
            {
              $group: {
                _id: null,
                totalTransfers: { $sum: "$medicineItems.qty" },
              },
            },
          ],
          as: "transferToHoData",
        },
      },

      // Aggregate quantities from recieved stock
      {
        $lookup: {
          from: "recievedrecords",
          let: { itemId: "$_id" },
          pipeline: [
            { $unwind: "$recievedItems" },
            {
              $match: {
                $expr: { $eq: ["$recievedItems.item_id", "$$itemId"] },
              },
            },
            {
              $group: {
                _id: null,
                totalRecieved: { $sum: "$recievedItems.recievedQty" },
              },
            },
          ],
          as: "recievedStockData",
        },
      },

      // Step 6: Calculate openingStock and closingStock
      {
        $addFields: {
          usageTotal: { $sum: "$usageData.totalUsage" },
          salesTotal: { $sum: "$medicineSalesData.totalSales" },
          transfersTotal: { $sum: "$transferToHoData.totalTransfers" },
          stockRecievedTotal: { $sum: "$recievedStockData.totalRecieved" },

          // Step 6: Calculate openingStock
          openingStock: {
            $subtract: [
              {
                $add: ["$currentQty", { $ifNull: ["$stockRecievedTotal", 0] }],
              },
              {
                $add: [
                  { $ifNull: ["$usageTotal", 0] },
                  { $ifNull: ["$salesTotal", 0] },
                  { $ifNull: ["$transfersTotal", 0] },
                ],
              },
            ],
          },

          // Calculate closingStock based on transactions left
          closingStock: {
            $subtract: [
              "$openingStock",
              {
                $add: [
                  { $ifNull: ["$usageTotal", 0] },
                  { $ifNull: ["$salesTotal", 0] },
                  { $ifNull: ["$transfersTotal", 0] },
                ],
              },
            ],
          },
        },
      },

      // Step 7: Group and Project Final Result
      {
        $group: {
          _id: "$_id",
          openingStock: { $first: "$openingStock" },
          closingStock: { $first: "$closingStock" },
          relatedBranches: { $first: "$relatedBranches" },

          relatedMedicineItemsData: { $push: "$relatedMedicineItemsData" },
          relatedProcedureItemsData: { $push: "$relatedProcedureItemsData" },

          transferToHoData: { $push: "$transferToHoData" },
          medicineSalesData: { $push: "$medicineSalesData" },
          recievedStockData: { $push: "$recievedStockData" },

          fromUnit: { $first: "$fromUnit" },
          toUnit: { $first: "$toUnit" },
          totalUnit: { $first: "$totalUnit" },
        },
      },

      {
        $project: {
          _id: 1,
          openingStock: { $ifNull: ["$openingStock", 0] },
          closingStock: { $ifNull: ["$closingStock", 0] },
          relatedBranches: "$relatedBranches.name",

          relatedMedicineItemsData: 1,
          relatedProcedureItemsData: 1,

          transferToHoData: 1,
          medicineSalesData: 1,
          recievedStockData: 1,

          fromUnit: 1,
          toUnit: 1,
          totalUnit: 1,
        },
      },
    ]);

    const StockModelCount = await stock.countDocuments(StockModelMatch);

    return res.status(200).json({
      success: true,
      StockCounts: StockModelCount,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      existsStockSchema: stockSummary,
      // existsPurchaseRequestSchema: PurchaseSummary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.transferToHo = async (req, res, next) => {
  const specificDate = new Date("2024-01-24");

  const summaryData = await purchaseRequestModel.aggregate([
    // First, aggregate the PurchaseRequests
    {
      $match: {
        date: specificDate, // Replace with your filter criteria
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "relatedBranch",
        foreignField: "_id",
        as: "relatedBranchData",
      },
    },
    {
      $lookup: {
        from: "generalitems",
        localField: "generalItems.item_id",
        foreignField: "_id",
        as: "generalItemsData",
      },
    },
    {
      $lookup: {
        from: "medicineitems",
        localField: "medicineItems.item_id",
        foreignField: "_id",
        as: "medicineItemsData",
      },
    },
    {
      $lookup: {
        from: "procedureitems",
        localField: "procedureItems.item_id",
        foreignField: "_id",
        as: "procedureItemsData",
      },
    },
    {
      $lookup: {
        from: "accessoryitems",
        localField: "accessoryItems.item_id",
        foreignField: "_id",
        as: "accessoryItemsData",
      },
    },
    {
      $project: {
        _id: 0,
        type: "PurchaseRequest", // Distinguishing the source of data
        relatedBranch: { $arrayElemAt: ["$relatedBranchData.name", 0] },
        totalQTY: 1,
        totalPrice: 1,
        generalItems: {
          $map: {
            input: "$generalItems",
            as: "item",
            in: {
              name: { $arrayElemAt: ["$generalItemsData.name", 0] },
              requestedQty: "$$item.requestedQty",
              purchasePrice: "$$item.purchasePrice",
            },
          },
        },
        medicineItems: {
          $map: {
            input: "$medicineItems",
            as: "item",
            in: {
              name: { $arrayElemAt: ["$medicineItemsData.name", 0] },
              requestedQty: "$$item.requestedQty",
              purchasePrice: "$$item.purchasePrice",
            },
          },
        },
        procedureItems: {
          $map: {
            input: "$procedureItems",
            as: "item",
            in: {
              name: { $arrayElemAt: ["$procedureItemsData.name", 0] },
              requestedQty: "$$item.requestedQty",
              purchasePrice: "$$item.purchasePrice",
            },
          },
        },
        accessoryItems: {
          $map: {
            input: "$accessoryItems",
            as: "item",
            in: {
              name: { $arrayElemAt: ["$accessoryItemsData.name", 0] },
              requestedQty: "$$item.requestedQty",
              purchasePrice: "$$item.purchasePrice",
            },
          },
        },
      },
    },

    // Use $unionWith to aggregate data from the Purchases collection
    {
      $unionWith: {
        coll: "purchases",
        pipeline: [
          {
            $lookup: {
              from: "branches",
              localField: "relatedBranch",
              foreignField: "_id",
              as: "relatedBranchData",
            },
          },
          {
            $lookup: {
              from: "generalitems",
              localField: "generalItems.item_id",
              foreignField: "_id",
              as: "generalItemsData",
            },
          },
          {
            $lookup: {
              from: "medicineitems",
              localField: "medicineItems.item_id",
              foreignField: "_id",
              as: "medicineItemsData",
            },
          },
          {
            $lookup: {
              from: "procedureitems",
              localField: "procedureItems.item_id",
              foreignField: "_id",
              as: "procedureItemsData",
            },
          },
          {
            $lookup: {
              from: "accessoryitems",
              localField: "accessoryItems.item_id",
              foreignField: "_id",
              as: "accessoryItemsData",
            },
          },
          {
            $project: {
              _id: 0,
              type: "Purchase", // Distinguishing the source of data
              relatedBranch: { $arrayElemAt: ["$relatedBranchData.name", 0] },
              totalQTY: 1,
              totalPrice: 1,
              generalItems: {
                $map: {
                  input: "$generalItems",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$generalItemsData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
              medicineItems: {
                $map: {
                  input: "$medicineItems",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$medicineItemsData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
              procedureItems: {
                $map: {
                  input: "$procedureItems",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$procedureItemsData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
              accessoryItems: {
                $map: {
                  input: "$accessoryItems",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$accessoryItemsData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
            },
          },
        ],
      },
    },

    // Use $unionWith again to aggregate data from the StockRequest collection
    {
      $unionWith: {
        coll: "stockrequests",
        pipeline: [
          {
            $lookup: {
              from: "branches",
              localField: "relatedBranch",
              foreignField: "_id",
              as: "relatedBranchData",
            },
          },
          {
            $lookup: {
              from: "generalitems",
              localField: "generalItems.item_id",
              foreignField: "_id",
              as: "generalItemsData",
            },
          },
          {
            $lookup: {
              from: "proceduremedicine",
              localField: "procedureMedicine.item_id",
              foreignField: "_id",
              as: "procedureMedicineData",
            },
          },
          {
            $lookup: {
              from: "medicinelists",
              localField: "medicineLists.item_id",
              foreignField: "_id",
              as: "medicineListsData",
            },
          },
          {
            $lookup: {
              from: "procedureaccessory",
              localField: "procedureAccessory.item_id",
              foreignField: "_id",
              as: "procedureAccessoryData",
            },
          },
          {
            $project: {
              _id: 0,
              type: "StockRequest", // Distinguishing the source of data
              relatedBranch: { $arrayElemAt: ["$relatedBranchData.name", 0] },
              totalQTY: 1,
              generalItems: {
                $map: {
                  input: "$generalItems",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$generalItemsData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
              procedureMedicine: {
                $map: {
                  input: "$procedureMedicine",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$procedureMedicineData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
              medicineLists: {
                $map: {
                  input: "$medicineLists",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$medicineListsData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
              procedureAccessory: {
                $map: {
                  input: "$procedureAccessory",
                  as: "item",
                  in: {
                    name: { $arrayElemAt: ["$procedureAccessoryData.name", 0] },
                    requestedQty: "$$item.requestedQty",
                    purchasePrice: "$$item.purchasePrice",
                  },
                },
              },
            },
          },
        ],
      },
    },
  ]);

  // // Prepare the Excel workbook and worksheet
  // const workBook = new ExcelJs.Workbook();
  // const workSheet = workBook.addWorksheet("Transfer To HO By Date");

  // // Define the Excel columns
  // workSheet.columns = [
  //   { header: "Related Branch Name", key: "relatedBranch", width: 25 },
  //   { header: "Reason", key: "reason", width: 25 },
  //   { header: "Date", key: "date", width: 25 },
  //   { header: "Item Name", key: "itemName", width: 25 },
  //   { header: "Item Quantity", key: "itemQty", width: 25 },
  // ];

  // // Iterate over the summary data and add rows for each item
  // TransferToHoSummary.forEach((record) => {
  //   const {
  //     relatedBranch,
  //     reason,
  //     date,
  //     medicineItems,
  //     procedureItems,
  //     accessoryItems,
  //     generalItems,
  //   } = record;

  //   // Add rows for medicine items
  //   medicineItems.forEach((item) => {
  //     workSheet.addRow({
  //       relatedBranch,
  //       reason,
  //       date,
  //       itemName: item.name,
  //       itemQty: item.qty,
  //     });
  //   });

  //   // Add rows for procedure items
  //   procedureItems.forEach((item) => {
  //     workSheet.addRow({
  //       relatedBranch,
  //       reason,
  //       date,
  //       itemName: item.name,
  //       itemQty: item.qty,
  //     });
  //   });

  //   // Add rows for accessory items
  //   accessoryItems.forEach((item) => {
  //     workSheet.addRow({
  //       relatedBranch,
  //       reason,
  //       date,
  //       itemName: item.name,
  //       itemQty: item.qty,
  //     });
  //   });

  //   // Add rows for general items
  //   generalItems.forEach((item) => {
  //     workSheet.addRow({
  //       relatedBranch,
  //       reason,
  //       date,
  //       itemName: item.name,
  //       itemQty: item.qty,
  //     });
  //   });
  // });

  // // Ensure that the exports directory exists
  // const exportDir = path.join(process.cwd() + "/exports");
  // if (!fs.existsSync(exportDir)) {
  //   fs.mkdirSync(exportDir, { recursive: true }); // Create the directory if it doesn't exist
  // }

  // console.log(exportDir);

  // // Save the Excel file
  // const filePath = path.join(exportDir);

  // await workBook.xlsx.writeFile(filePath);

  // Send the file path as a response
  return res.status(200).json({
    success: true,
    message: "File exported successfully",
    // filePath,
    summaryData,
  });
};
