'use strict';
const Bank = require('../models/bank');
const AccountingList = require('../models/accountingList');
const blog = require('../models/blog');
const path = require("path");
const description = require('../models/description');

exports.listAllBlog = async (req, res) => {
  let count = 0;
  let page = 0;
  let query = { isDeleted: false, $each: { relatedDescription: {$eq: { isDeleted: true}}} }
  try {
    let result = await blog.find(query).populate("relatedDescription").then(documents => {
        const filteredDocuments = documents.map(document => {
          // Filter the relatedDescription array
          const filteredRelatedDescription = document.relatedDescription.filter(item => !item.isDeleted);

          // Return a new object with the filtered relatedDescription
          return {
            _id: document._id,
            name: document.name,
            isDeleted: document.isDeleted,
            relatedDescription: filteredRelatedDescription,
            __v: document.__v
          };
        })
        return filteredDocuments
    });
    count = await blog.find(query).count();
    res.status(200).send({
      success: true,
      data: result,
    });
  } catch (e) {
    return res.status(500).send({ error: true, message: e.message });
  }
};

exports.createBlog = async (req, res, next) => {
  let { name, datas } = req.body;
  console.log(req.body)
  
  let imageArray = []
  let data = {}
  try {
    let parseData = JSON.parse(datas)
    var blogData = await blog.create({name: name})
    if (req.files) {
      console.log(req.files,'files')
        req.files.forEach(async (file)=>{
            const nomalizePath = path.join(file.path)
            const pathes = nomalizePath.split("uploads")[1]
            imageArray.push(pathes)
    })
   }
   parseData.map(async(result,index) => {
        data.relatedName = blogData._id
        data.description = result.description
        data.title = result.title
        data.imageUrl = imageArray[index] || null
        var descriptionData = await description.create(data)
        await blog.findByIdAndUpdate(blogData._id, {$push: {relatedDescription: descriptionData._id}})

   })
   return res.status(200).send({
        success: true,
        message: "Create Blog Successfully",
        data: blogData
   })
  } catch (error) {
    // console.log(error )
    return res.status(500).send({ "error": true, message: error.message })
  }
};
exports.updateDescription = async (req,res,next) => {
    try {
        if(req.files){
           req.files.forEach(async (file)=>{
            const nomalizePath = path.join(file.path)
            const pathes = nomalizePath.split("uploads")[1]
            await description.findByIdAndUpdate(req.params.id,{imageUrl: pathes})
         })
        }
        let result = await description.findByIdAndUpdate(req.params.id,{...req.body},{new: true})
        return res.status(200).send({
            success: true,
            message: "Updated Description Successfully",
            data: result
       })
    } catch (error) {
      return res.status(500).send({ "error": true, "message": error.message })
    }
}

exports.updateBlog = async (req, res, next) => {
  try {
    let { relatedDescription, ...data} = req.body
    let result = await blog.findByIdAndUpdate(req.params.id, data,{new: true})
    res.status(200).send({
        success: true,
        message: "Updated Successfully",
        data: result

    })
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.getBlogById = async (req, res, next) => {
  try {
    let result = await blog.findById(req.params.id).populate("relatedDescription")
    res.status(200).send({
        success: true,
        message: "Detail Blog By Id",
        data: result

    })
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })
  }
};

exports.addDescription = async (req, res, next) => {
    try {
      let imageArray = []
      if(req.files){
        req.files.forEach(async (file)=>{
         const nomalizePath = path.join(file.path)
         const pathes = nomalizePath.split("uploads")[1]
         imageArray.push(pathes)
      })
      }
      req.body.relatedName = req.params.id
      req.body.imageUrl = imageArray[0] || null
      let addDescription = await description.create(req.body)
      let result = await blog.findByIdAndUpdate(req.params.id,{$push: {relatedDescription: addDescription._id}},{new: true})
                         .populate("relatedDescription")
      res.status(200).send({
          success: true,
          message: "added blog Successfully",
          data: result
  
      })
    } catch (error) {
      return res.status(500).send({ "error": true, "message": error.message })
    }
  };

  exports.deleteDescription = async (req, res, next) => {
    try {
      await description.findByIdAndUpdate(req.params.id,{isDeleted: true})
      res.status(200).send({
          success: true,
          message: "delete Description Successfully"
      })
    } catch (error) {
      return res.status(500).send({ "error": true, "message": error.message })
    }
  };

exports.deleteBlog = async (req, res, next) => {
  try {
    const result = await blog.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true },
    );
    return res.status(200).send({ success: true, data: { isDeleted: result.isDeleted } });
  } catch (error) {
    return res.status(500).send({ "error": true, "message": error.message })

  }
}