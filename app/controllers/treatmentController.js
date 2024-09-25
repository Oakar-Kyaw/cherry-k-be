"use strict";
const Treatment = require("../models/treatment");
const Accounting = require("../models/accountingList");
const moment = require("moment-timezone");

//loop all medicine
const loop = (length, arr, allLists, name) => {
  for (let i = 0; i < length; i++) {
    arr.push({ title: name, items: allLists[i] });
  }
};

exports.listAllTreatments = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 30; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query["role"] = role.toUpperCase()) : "";
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, "i"))
      : "";
    regexKeyword ? (query["name"] = regexKeyword) : "";

    let result = await Treatment.find(query)
      .populate("relatedDoctor")
      .populate("relatedTherapist")
      .populate("relatedPatient")
      .populate("machine.item_id")
      .populate("procedureAccessory.item_id")
      .populate("medicineLists.item_id")
      .populate("procedureMedicine.item_id")
      .populate("treatmentName")
      .populate({
        path: "general.item_id",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits",
        },
      });
    count = await Treatment.find(query).count();
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
    //console.log(e)
    //return res.status(500).send({ error: true, message: e.message });
  }
};

exports.getTreatment = async (req, res) => {
  const result = await Treatment.find({ _id: req.params.id, isDeleted: false })
    .populate("relatedDoctor")
    .populate("relatedTherapist")
    .populate("relatedPatient")
    .populate("machine.item_id")
    .populate("procedureAccessory.item_id")
    .populate("medicineLists.item_id")
    .populate("procedureMedicine.item_id")
    .populate("treatmentName")
    .populate({
      path: "general.item_id",
      model: "GeneralItems",
      populate: {
        path: "name",
        model: "GeneralUnits",
      },
    });
  if (!result)
    return res.status(500).json({ error: true, message: "No Record Found" });
  return res.status(200).send({ success: true, data: result });
};

exports.createTreatment = async (req, res, next) => {
  let { name } = req.body;
  let data = req.body;
  try {
    const accResult = await Accounting.create({
      name: name + "income",
      subHeader: name + "income",
      relatedType: "6467310959a9bc811d97e9c9", //Profit and Loss
      relatedHeader: "646731e059a9bc811d97eab9", //Revenue
    });
    data = { ...data, relatedAccount: accResult._id }; //putting it back into treatment.js
    const result = await Treatment.create(data);

    res.status(200).send({
      message: "Treatment create success",
      success: true,
      accResult: accResult,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.updateTreatment = async (req, res, next) => {
  try {
    req.body.editTime = moment()
      .tz("Asia/Yangon")
      .format("MMMM Do YYYY, h:mm:ss a");
    req.body.editPerson = req.credentials.id;
    req.body.editEmail = req.credentials.email;
    const result = await Treatment.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    )
      .populate("relatedDoctor")
      .populate("relatedTherapist")
      .populate("relatedPatient")
      .populate("")
      .populate("machine.item_id")
      .populate("procedureAccessory.item_id")
      .populate("medicineLists.item_id")
      .populate("procedureMedicine.item_id")
      .populate("treatmentName")
      .populate({
        path: "general.item_id",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits",
        },
      });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.deleteTreatment = async (req, res, next) => {
  try {
    req.body.deleteTime = moment()
      .tz("Asia/Yangon")
      .format("MMMM Do YYYY, h:mm:ss a");
    req.body.deletePerson = req.credentials.id;
    req.body.deleteEmail = req.credentials.email;
    const result = await Treatment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true, ...req.body },
      { new: true }
    );
    return res
      .status(200)
      .send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.activateTreatment = async (req, res, next) => {
  try {
    const result = await Treatment.findOneAndUpdate(
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

exports.searchTreatments = async (req, res, next) => {
  try {
    const result = await Treatment.find({ $text: { $search: req.body.search } })
      .populate("relatedDoctor")
      .populate("relatedTherapist")
      .populate("relatedPatient")
      .populate("")
      .populate("machine.item_id")
      .populate("procedureAccessory.item_id")
      .populate("medicineLists.item_id")
      .populate("procedureMedicine.item_id")
      .populate("treatmentName")
      .populate("general.item_id");
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message });
  }
};

exports.getRelatedTreatmentByTreatmentListID = async (req, res) => {
  try {
    const result = await Treatment.find({
      treatmentName: req.params.id,
      isDeleted: false,
    })
      .populate("relatedDoctor")
      .populate("relatedTherapist")
      .populate("relatedPatient")
      .populate("")
      .populate("machine.item_id")
      .populate({
        path: "procedureAccessory.item_id",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
        },
      })
      .populate({
        path: "medicineLists.item_id",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
        },
      })
      .populate({
        path: "procedureMedicine.item_id",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
        },
      })
      .populate({
        path: "general.item_id",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits",
        },
      })
      .populate("treatmentName");
    if (result.length === 0)
      return res.status(404).send({ error: true, message: "No Record Found!" });
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};

exports.getAllTreatmentUnits = async (req, res) => {
  try {
    const result = await Treatment.find({ isDeleted: false })
      .populate("relatedDoctor")
      .populate("relatedTherapist")
      .populate("relatedPatient")
      .populate("")
      .populate("machine.item_id")
      .populate("procedureAccessory.item_id")
      .populate("medicineLists.item_id")
      .populate("procedureMedicine.item_id")
      .populate("treatmentName")
      .populate("general.item_id");

    if (!result || result.length === 0) {
      return res.status(404).send({
        error: true,
        message: "No Record Found!",
      });
    }

    return res.status(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).send({
      error: true,
      message: "Error on retrieving All Treatments Unit",
    });
  }
};

exports.getDataToExportExcel = async (req, res, next) => {
  try {
    let medicineLists = [];
    let queryDataList = await Treatment.find({
      treatmentName: req.params.id,
      isDeleted: false,
    })
      .populate({
        path: "treatmentName",
        model: "TreatmentLists",
      })
      .populate("machine.item_id")
      .populate({
        path: "procedureAccessory.item_id",
        model: "AccessoryItems",
        populate: {
          path: "name",
          model: "ProcedureAccessories",
        },
      })
      .populate({
        path: "medicineLists.item_id",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists",
        },
      })
      .populate({
        path: "procedureMedicine.item_id",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines",
        },
      })
      .populate({
        path: "general.item_id",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits",
        },
      });
    for (let i = 0; i < queryDataList.length; i++) {
      if (queryDataList[i].procedureMedicine) {
        loop(
          queryDataList[i].procedureMedicine.length,
          medicineLists,
          queryDataList[i].procedureMedicine,
          queryDataList[i].name
        );
      }
      if (queryDataList[i].medicineLists) {
        loop(
          queryDataList[i].medicineLists.length,
          medicineLists,
          queryDataList[i].medicineLists,
          queryDataList[i].name
        );
      }
      if (queryDataList[i].procedureAccessory) {
        loop(
          queryDataList[i].procedureAccessory.length,
          medicineLists,
          queryDataList[i].procedureAccessory,
          queryDataList[i].name
        );
      }
      if (queryDataList[i].general) {
        loop(
          queryDataList[i].general.length,
          medicineLists,
          queryDataList[i].general,
          queryDataList[i].name
        );
      }
      if (queryDataList[i].machine) {
        loop(
          queryDataList[i].machine.length,
          medicineLists,
          queryDataList[i].machine,
          queryDataList[i].name
        );
      }
    }
    return res.status(200).send({
      success: true,
      list: medicineLists,
      count: medicineLists.length,
    });
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message });
  }
};
