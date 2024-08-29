"use strict"

const generalItem = require("../models/generalItem")
const medicineItem = require("../models/medicineItem")
const procedureItem = require("../models/procedureItem")

exports.createStockOpeningClosing = async () => {
 // Logic for creating stock opening and closing records
    let medicineItems = await medicineItem.find({isDeleted: false})
    let procedureItems = await procedureItem.find({isDeleted: false})
    let accessoryItems = await accessoryItem.find({isDeleted: false})
    let generalItems = await generalItem.find({isDeleted: false})
    
}