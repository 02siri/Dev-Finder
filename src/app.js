require('dotenv').config();
require("./utils/cronJobs"); //This file will run as soon as app runs
const express = require ('express');
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require('./routes/user');
const paymentRouter = require('./routes/payment');
const cors = require("cors");

//Creating new (instance of) application of express 
const app = express();
app.use(cors({
    //whitelisting this domain name, so that it can receive cookies 
     origin: [
        "http://localhost:5173",     
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
})
);

app.use(express.json());
//Adding cookie parser middleware
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/",paymentRouter);


connectDB().then(()=>{
    console.log("Database connection established...");

    //created a server on port 7777, and my app is listening on this server
    //this callback function will only work if my sever has been started successfully
app.listen(process.env.PORT, ()=>{
    console.log("Successfully listening on port 7777");
});

}).catch((err)=>{
    console.log("Database cannot be connected!");
});




