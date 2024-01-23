"use strict"

const AccountingList = require("../models/accountingList")
const TransferFromHo = require("../models/transferFromHo")

exports.createTransferAmountFromHO = async (req,res) => {
     let data = req.body
     let { fromAccount, toAccount, transferAmount } = data
     try {
        let result = await TransferFromHo.create(data)
        let deductFromAccountingList = await AccountingList.findByIdAndUpdate(fromAccount, {$inc: { amount: - transferAmount}})
        let increaseFromAccountingList = await AccountingList.findByIdAndUpdate(toAccount, {$inc: { amount: transferAmount}})

        res.status(200).send({
                success: true,
                data: result
            })
     }
     catch(error){
        res.status(500).send({
            error: true,
            message: error.message
        })
     } 
}

exports.listAllTransferAmountFromHo = async (req,res) => {
    let { keyword, role, limit, page, skip, fromDate, toDate } = req.query;
    try {
        // console.log("this is role ")
        let query = { isDeleted: false }
        limit = limit ? limit : 0
        skip = skip ? (skip-1) * limit : 0
        fromDate && toDate ? query.transferDate = {"$gte" : new Date(fromDate), "$lte": new Date(toDate)}
                           : fromDate ? query.transferDate = {"$gte" : new Date(fromDate) }
                           : toDate ? query.transferDate = { "$lte": new Date(toDate) }
                           : ""
        let result = await TransferFromHo.find(query).skip(skip).limit(limit).populate("fromAccount toAccount")
        let count = await TransferFromHo.find(query).count()
        if(result){
            res.status(200).send({
                success: true,
                data: result,
                meta_data : {
                    total_count: count,
                    per_page: limit ? limit : count,
                    total_page: limit ? Math.ceil(count/limit) : 1
                }
            })
        }
        else {
            res.status(200).send({
                success: true,
                data: "There is no transfer Amount"
            })
        }
        
    }catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }
}

exports.getTransferFromHOById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await TransferFromHo.findOne({ _id: id }).populate("fromAccount toAccount")
      result ? res.status(200).send({
                                 success: true,
                                 data: result
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.updateTransferFromHOById = async ( req, res ) => {
    let { id } = req.params
    let data = req.body
    try{
      let result = await TransferFromHo.findByIdAndUpdate(id,data)
      let updatedData = await TransferFromHo.findOne({ _id: id }).populate("fromAccount toAccount") 
      result ? res.status(200).send({
                                 success: true,
                                 data: updatedData,
                                 message: "Updated Successfully"
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}

exports.deleteTransferFromHOById = async ( req, res ) => {
    let { id } = req.params
    try{
      let result = await TransferFromHo.findByIdAndUpdate(id,{isDeleted: true}).populate("fromAccount toAccount")
      result ? res.status(200).send({
                                 success: true,
                                 message: "Deleted Successfully"
                                    })
             : res.status(200).send({
                success: true,
                message: "There is no data for this one"
             })
    }
    catch(error){
        res.status(500).send({
            error:true,
            message:error.message
        })
    }   
}