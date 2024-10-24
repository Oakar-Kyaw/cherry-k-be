"use strict";

const PatientModels = require("../models/patient");

exports.filterPatient = async (name, phone, relatedBranch) => {
  let query = {
    isDeleted: false,
    relatedBranch: relatedBranch,
  };

  if (name) {
    query.name = new RegExp(name, "i");
  }

  if (phone) {
    query.phone = new RegExp(phone, "i");
  }

  console.log("query", query);

  const debugPatients = await PatientModels.find(query);
  console.log("Debug patients", debugPatients);

  return debugPatients;
};
