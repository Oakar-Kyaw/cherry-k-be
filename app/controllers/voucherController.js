"use strict";
const Voucher = require("../models/voucher");
const MedicineSale = require("../models/medicineSale");
const MedicineItems = require("../models/medicineItem");
const MedicineItemsRecords = require("../models/medicineItemRecord");
const { populate } = require("../models/voucher");

exports.listAllVouchers = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 10; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";
    let result = await Voucher.find(query);
    count = await Voucher.find(query).count();
    const division = count / limit;
    page = Math.ceil(division);

    res.status(200).send({
      success: true,
      count: count,
      _metadata: {
        current_page: skip / limit + 1,
        per_page: limit,
        page_count: page,
        total_count: count,
      },
      list: result,
    });
  } catch (e) {
    return res.status(500).send({ error: true, message: e.message });
  }
};

exports.getVoucher = async (req, res) => {
  const result = await Voucher.find({ _id: req.params.id, isDeleted: false });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.createVoucher = async (req, res, next) => {
  try {
    const newVoucher = new Voucher(req.body);
    const result = await newVoucher.save();
    res.status(200).send({
      message: "Voucher create success",
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.createVoucherWithValidation = async (req, res, next) => {
  try {
    const newVoucher = new Voucher(req.body);
    const result = await newVoucher.save();
    const populatedVoucher = await Voucher.find({ _id: result._id }).populate(
      "medicineSaleItems.item_id"
    );
    //prepare calculation
    let total = [];
    populatedVoucher[0].medicineSaleItems.map(function (element, index) {
      let productPrice = element.item_id.sellingPrice * element.quantity; // calculate price of total products
      const finalPrice = productPrice - (element.discount / 100) * productPrice; // calculate discount
      total.push(finalPrice);
    });
    const totalAmount = total.reduce(
      (accumulator, currentValue) => accumulator + currentValue
    );
    const grandTotal = totalAmount - (req.body.discount / 100) * totalAmount; // calculate discount
    //prepare to update data
    let data = req.body;
    data = { ...data, totalAmount: totalAmount, grandTotal: grandTotal };
    const updateResult = await Voucher.findOneAndUpdate(
      { _id: result._id },
      data,
      { new: true }
    ).populate("medicineSaleItems.item_id");
    res.status(200).send({
      message: "Voucher create success",
      success: true,
      data: updateResult,
    });
  } catch (error) {
    //console.log(error)
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateVoucher = async (req, res, next) => {
  try {
    const result = await Voucher.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    );
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findOne({ _id: id }).populate(
      "medicineSaleItems.item_id"
    );

    if (!voucher) {
      return res
        .status(404)
        .send({ error: true, message: "Voucher not found" });
    }

    // Reserving the quantity for eact item in MedicineSale and Update MedicineItems Stock
    for (const SaleMedicineItems of voucher.medicineSaleItems) {
      const medicineItemDoc = await MedicineItems.findById(
        SaleMedicineItems.item_id
      );

      if (medicineItemDoc) {
        // Increment the quantity back to the stock
        medicineItemDoc.currentQuantity += SaleMedicineItems.quantity;

        // Save the updated quantity
        await medicineItemDoc.save();

        // Create a record for the transaction
        const AfterDeleteRecord = new MedicineItemsRecords({
          medicineItems: [
            {
              item_id: medicineItemDoc._id,
              qty: SaleMedicineItems.quantity,
              actual: medicineItemDoc.currentQuantity,
            },
          ],
          relatedBranch: voucher.relatedBranch,
          reason: `Voucher cancellation - returning items to stock`,
        });

        await AfterDeleteRecord.save();
      }
    }

    // const result = await Voucher.findOneAndUpdate(
    //   { _id: req.params.id },
    //   { isDeleted: true },
    //   { new: true }
    // );

    // Mark the MedicineSale as deleted
    await MedicineSale.updateMany(
      { voucherCode: voucher.voucherCode },
      { isDeleted: true },
      { new: true }
    );

    // Mark the Voucher as deleted
    voucher.isDeleted = true;
    voucher.status = "Canceled";
    await voucher.save();

    return res
      .status(200)
      .send({ success: true, data: { isDeleted: voucher.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateVoucher = async (req, res, next) => {
  try {
    const result = await Voucher.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.addDeliveryInfo = async (req, res, next) => {
  try {
    const { id, deliveryDate, deliveryPerson, remark } = req.body;

    const result = await Voucher.findOneAndUpdate(
      { _id: id },
      { deliveryDate, deliveryPerson, remark },
      { new: true }
    );

    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
