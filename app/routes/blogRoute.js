"use strict";

const blog = require("../controllers/blogController");
const { catchError } = require("../lib/errorHandler");
const upload = require("../lib/fieldUploader");
const verifyToken = require('../lib/verifyToken');

module.exports = (app) => {

    app.route('/api/blog')
        .post(upload.array("blog",5), catchError(blog.createBlog))

    app.route('/api/blog/:id')
        .delete(catchError(blog.deleteBlog)) 
        .put(upload.array("blog",5), catchError(blog.updateBlog))
        .post(upload.array("blog",5), catchError(blog.addDescription))
        .get(catchError(blog.getBlogById))

    app.route('/api/blog-update/:id')
        .put(upload.array("blog",5), catchError(blog.updateDescription))
        .delete(catchError(blog.deleteDescription))


    app.route('/api/blogs').get(catchError(blog.listAllBlog))
};
