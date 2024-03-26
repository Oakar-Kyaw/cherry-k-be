'use strict';
const dentalTreatment = require('../models/dentalTreatment');
const Accounting = require('../models/accountingList');

//loop all medicine
const loop = (length, arr, allLists, name) => {
  for (let i = 0; i < length; i++) {
    arr.push({ title: name, items: allLists[i] })
  }
}

exports.listAllDentalTreatments = async (req, res) => {
  let { keyword, role, limit, skip } = req.query;
  let count = 0;
  let page = 0;
  try {
    limit = +limit <= 100 ? +limit : 30; //limit
    skip = +skip || 0;
    let query = { isDeleted: false },
      regexKeyword;
    role ? (query['role'] = role.toUpperCase()) : '';
    keyword && /\w/.test(keyword)
      ? (regexKeyword = new RegExp(keyword, 'i'))
      : '';
    regexKeyword ? (query['name'] = regexKeyword) : '';

    let result = await dentalTreatment.find(query).populate('relatedDoctor').populate('relatedTherapist').populate('relatedPatient').populate('machine.item_id').populate('procedureAccessory.item_id').populate('medicineLists.item_id').populate('procedureMedicine.item_id').populate('dentalTreatmentName').populate({
      path: "general.item_id",
      model: "GeneralItems",
      populate: {
        path: "name",
        model: "GeneralUnits"
      }
    })
    count = await dentalTreatment.find(query).count();
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

exports.getDentalTreatment = async (req, res) => {
  const result = await dentalTreatment.find({ _id: req.params.id, isDeleted: false }).populate('relatedDoctor').populate('relatedTherapist').populate('relatedPatient').populate('machine.item_id').populate('procedureAccessory.item_id').populate('medicineLists.item_id').populate('procedureMedicine.item_id').populate('dentalTreatmentName').populate({
    path: "general.item_id",
    model: "GeneralItems",
    populate: {
      path: "name",
      model: "GeneralUnits"
    }
  })
  if (!result)
    return res.status(500).json({ error: true, message: 'No Record Found' });
  return res.status(200).send({ success: true, data: result });
};

exports.createDentalTreatment = async (req, res, next) => {
  let { name } = req.body;
  let data = req.body
  try {
    const accResult = await Accounting.create({
      name: name + 'income',
      subHeader: name + 'income',
      relatedType: "6467310959a9bc811d97e9c9", //Profit and Loss
      relatedHeader: "646731e059a9bc811d97eab9",//Revenue
    })
    data = { ...data, relatedAccount: accResult._id } //putting it back into treatment.js
    const result = await dentalTreatment.create(data);

    res.status(200).send({
      message: 'Dental Treatment create success',
      success: true,
      accResult: accResult,
      data: result
    });
  } catch (error) {
    return res.status(500).send({ "error": true, message: error.message })
  }
};

exports.updateDentalTreatment = async (req, res, next) => {
  try {
    const result = await dentalTreatment.findOneAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true },
    ).populate('relatedDoctor').populate('relatedTherapist').populate('relatedPatient').populate('').populate('machine.item_id').populate('procedureAccessory.item_id').populate('medicineLists.item_id').populate('procedureMedicine.item_id').populate('dentalTreatmentName').populate({
      path: "general.item_id",
      model: "GeneralItems",
      populate: {
        path: "name",
        model: "GeneralUnits"
      }
    })
    return res.status(200).send({ success: true, data: result });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.deleteDentalTreatment = async (req, res, next) => {
  try {
    console.log("efd",req.params.id)
    const result = await dentalTreatment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true },
    );
    return res.status(200).send({ success: true, data: "Deleted Successfully" });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}

exports.activateDentalTreatment = async (req, res, next) => {
  try {
    const result = await dentalTreatment.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: false },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.searchDentalTreatments = async (req, res, next) => {
  try {
    const result = await dentalTreatment.find({ $text: { $search: req.body.search } }).populate('relatedDoctor').populate('relatedTherapist').populate('relatedPatient').populate('').populate('machine.item_id').populate('procedureAccessory.item_id').populate('medicineLists.item_id').populate('procedureMedicine.item_id').populate('dentalTreatmentName').populate('general.item_id')
    if (result.length === 0) return res.status(404).send({ error: true, message: 'No Record Found!' })
    return res.status(200).send({ success: true, data: result })
  } catch (err) {
    return res.status(500).send({ error: true, message: err.message })
  }
}

exports.getRelatedDentalTreatmentByTreatmentListID = async (req, res) => {
  try {
    const result = await dentalTreatment.find({ dentalTreatmentName: req.params.id, isDeleted: false })
      .populate('relatedDoctor')
      .populate('relatedTherapist')
      .populate('relatedPatient')
      .populate('')
      .populate('machine.item_id')
      .populate({
        path: 'procedureAccessory.item_id',
        model: 'AccessoryItems',
        populate: {
          path: 'name',
          model: 'ProcedureAccessories'
        }
      })
      .populate({
        path: "medicineLists.item_id",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists"
        }
      })
      .populate({
        path: "procedureMedicine.item_id",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines"
        }
      })
      .populate({
        path: "general.item_id",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits"
        }
      })
      .populate('dentalTreatmentName')
    if (result.length === 0) return res.status(404).send({ error: true, message: 'No Record Found!' })
    return res.status(200).send({ success: true, data: result })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}

exports.getDataToExportExcel = async (req, res, next) => {
  try {
    let medicineLists = []
    let queryDataList = await dentalTreatment.find({ dentalTreatmentName: req.params.id, isDeleted: false })
      .populate({
        path: 'dentalTreatmentName'
      })
      .populate('machine.item_id')
      .populate({
        path: 'procedureAccessory.item_id',
        model: 'AccessoryItems',
        populate: {
          path: 'name',
          model: 'ProcedureAccessories'
        }
      })
      .populate({
        path: "medicineLists.item_id",
        model: "MedicineItems",
        populate: {
          path: "name",
          model: "MedicineLists"
        }
      })
      .populate({
        path: "procedureMedicine.item_id",
        model: "ProcedureItems",
        populate: {
          path: "name",
          model: "ProcedureMedicines"
        }
      })
      .populate({
        path: "general.item_id",
        model: "GeneralItems",
        populate: {
          path: "name",
          model: "GeneralUnits"
        }
      })
    for (let i = 0; i < queryDataList.length; i++) {

      if (queryDataList[i].procedureMedicine) {
        loop(queryDataList[i].procedureMedicine.length, medicineLists, queryDataList[i].procedureMedicine, queryDataList[i].name)
      }
      if (queryDataList[i].medicineLists) {
        loop(queryDataList[i].medicineLists.length, medicineLists, queryDataList[i].medicineLists, queryDataList[i].name)
      }
      if (queryDataList[i].procedureAccessory) {
        loop(queryDataList[i].procedureAccessory.length, medicineLists, queryDataList[i].procedureAccessory, queryDataList[i].name)
      }
      if (queryDataList[i].general) {
        loop(queryDataList[i].general.length, medicineLists, queryDataList[i].general, queryDataList[i].name)
      }
      if (queryDataList[i].machine) {
        loop(queryDataList[i].machine.length, medicineLists, queryDataList[i].machine, queryDataList[i].name)
      }
    }
    return res.status(200).send({
      success: true,
      list: medicineLists,
      count: medicineLists.length
    })
  } catch (error) {
    return res.status(500).send({ error: true, message: error.message })
  }
}