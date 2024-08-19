// const { rateLimit } = require('express-rate-limit')
const fs = require("fs");
const express = require("express"),
        router = express.Router(),
        glob = require("glob"),
        logger = require("morgan"),
        cookieParser = require("cookie-parser"),
        bodyParser = require("body-parser"),
        compress = require("compression"),
        methodOverride = require("method-override"),
        cors = require("cors"),
        rootDir = `${__dirname}/../`;

    const path = require("path"),
        rootPath = path.normalize(__dirname + "/..");
    const uploadsURI = ["./uploads/cherry-k/blog", "./uploads/cherry-k/promotions", "./uploads/cherry-k/banners"]
    // const limiter = rateLimit({
    //     windowMs: 2 * 60 * 1000, // 60 seconds
    //     limit: 1, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    //     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    //     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    //     message: async (req, res) => {
    //         res.status(429).send({ success: false, message: 'You can only create vouchers within 1 minutes.'})
    //     },
    // }) 
    module.exports = function (app, config) {
        app.disable("x-powered-by");
        app.use(logger("dev"));
        app.use(bodyParser.urlencoded({extended: true, limit: "50mb"}));
        app.use(bodyParser.json({limit: "50mb"}));
        app.use(cookieParser());
        app.use(compress());
        app.use(methodOverride());
        // app.use("/api/treatment-selections/multi",limiter);
        // app.use("/api/treatment-vouchers/ms/single",limiter);
        app.use(cors({
            allowedHeaders: [
                "Origin",
                "X-Requested-With",
                "Content-Type",
                "Accept",
                "x-access-token",
            ],
            origin: "*",
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            preflightContinue: false
        }));
        uploadsURI.map(url => {
            fs.access(url, err => { // to check if given directory
                if (err) { // if current directory doesn't exist then create it
                    fs.mkdir(url, {
                        recursive: true
                    }, error => {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log("New Directory created successfully !!");
                        }
                    })
                } else {
                    console.log("Given directory already exists")
                }
            })
        })
        app.use("/uploads", express.static(path.join(process.cwd() + "/uploads")))
        const routes = glob.sync(config.root + '/app/routes/*.js');
        routes.forEach(function (route) {
            require(route)(app);
        });
    };
