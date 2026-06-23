# Episode 3: Creating Our Express Server
    - Create a repo
    - Initialize the repository (npm init)
    - node_modules, package.json, package-lock.json : saw the details and difference
    - Install express (npm install express)
    - Create a server (src/app.js)
    - Listen to port 7777
    - Write request handlers for /test, /hello
    - Install nodemon and update scripts inside package.json
    - What are dependencies 
    - What is the use of "-g" while npm install
    - Difference between tilda (~) and carat (^)
    - Why package-lock.json has been pushed to github

# Episode 4:
    - order of routes, and their extensions matter (eg, "/hello", "/hello/2",..)
    - Installed Postman app
        - make workspace -> collection -> test GET api call
    - Logic to handle GET, POST, PATCH, PUT, DELETE api calls & testing on Postman
    - Explore different kinds of routing
        - Use of ?, +, *, (), regex in the routes
        - Reading query parameters in the routes (req.query)
        - Reading dynamic routes (req.params)

# Episode 5: 
    - Handling multiple Route Handlers (RHs)
    - next()
    - next function and errors along with res.send();
    - app.use ("/route", rH1, [rH2, rH3], rH4, rH5 ) -> Array of RHs
    - What is a middleware; Why do we need it? 
    - How Express.js handles requests behind-the-scenes
    - Difference bw app.use() and app.all() [very small difference bw route handling]
    - Dummy auth middleware for admin
    - Dummy auth middleware for all user routes, except /user, /login
    - Error handling using app.use("/route", (err,req,res,next)=> {});
    - Error handling using try-catch

# Before Ep 6 (S1, Ep 13):
    - MongoDB Website 
    - Create free M0 cluster (on MongoDB Atlas)
    - Create a User 
    - Get the connection string
    - Use MongoDB Compass
# Episode 6: 
    - Install mongoose library
    - Connect your application to the database (not cluster) : "ConnectionURL"/devTinder
    - call the connectDB function and connect to database before starting application on 7777.
    - Create a userSchema, and User model 
    - Create /signup API to add data to database
    - Push some documents using API calls from postman
    - Error handling using try-catch

# Episode 7:
    - Diff bw JavaScript object and JSON object 
        //JSON always takes key-values pairs as string, but JS doesn't take the keys as string
    - Add express.json() middleware to the app
    //Why Express.json? 
        Whenever Im reading a request, I want that data to be parsed into json and then want to get it
    - Make signup API dynamic, to receive data from the end user (can be browser, postman, etc.)
    - User.findOne() with duplicate email Ids, which document will be returned : 
    - API: Get user by email: find(), findOne()
    - API: Feed api - GET /feed - get all users from the database : find()
    - API: Get user by Id : findById()
    - API: Delete user by Id : findByIdAndDelete(userId) or findOneAndDelete({_id: userID})
    - API: Update user by Id : findByIdAndUpdate(userId, data, options)
        - Explore options parameter in findByIdAndUpdate or findOneAndUpdate
    - Explore Mongoose documentation for Models

# Episode 8
    - Explored SchemType options from the documentation
    - add required, unique, lowercase, min/max length/value, trim
    - add default 
    - Create a custom validate function for gender
    - Improve the DB Schema - put all appropriate validations on each field in the schema
    - Add timestamps to the user schema 
    - Add API level validations on Patch request & Signup post API
    - Data Sanitization: API validations on each field
    - Install validator : npm i validator
    - Explore validator library functions & use them for password, email, Url, etc.
    - Never trust req.body

# Episode 9
    - Validate data in Signup API - create a helper/utility function
    - Install bcrypt package
    - Create a PasswordHash using bcrypt.hash() & save the users with encrypted passwords
    - Create Login API
        - Compare email and pswd : bcrypt.compare()
        - Throw errors if invalid
    
# JWT - Json Web Token
    - Industry Standard
    - Generates a unique token, that has a secret information embedded inside it, similar to a password Hash
    - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.-> Header eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0. -> Payload (has the actual data)
    KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30 -> Signature (validated)
    - use npm package: jsonwebtoken : to create jwt tokens 

# Episode 10
    - Install cookie-parser
    - Send a dummy cookie from /login to User
    - create a GET /profile API, send the cookie back
    - Install jsonwebtoken
    - In Login API, after email+pswd validation, create a JWT token, and send it back to user, inside cookies
    - Read the cookies inside your profile API and find the logged in user
    - write userAuth middleware
    - Add the userAuth middleware in APIs like : /profile, /sendConnectionRequest
    - Set the expiry of JWT token and cookies
    - Create userSchema method to getJWT
    - Create userSchema method to compare swds, take passwordInput 
    
# Episode 11
    - Exploring tinder APIs
    - Create list of all APIs in Dev-Finder
    - Group multiple routes under respective routers 
    - Read documentation for express.Router()
    - Create routes folder for managing auth, profile, request routers
    - Create routers - authRouter, profileRouter, requestRouter
    - Import these routers in app.js
    - Create POST /logout API
    - Create PATCH /profile/edit API
    - Create PATCH /profile/password API (forgot password)
    - Test all APIs 
    - Validate all data in every POST/PATCH requests     

# Episode 12 

INDEX:
// When we index certain fields in our DB, the API becomes faster
// If firstName is indexed, whenever I will query something with the first Name, the queries will be very fast
//If one field is being made as unique, MongoDB automatically makes that as the index of the DB 

COMPOUND INDEX:
// Making index on two fields together
//Whenver you will query on both the fields together, the query will be faster
//Eg: Finding Exsiting Connection Request query : because it is going through both fromUserId and toUserId
 -> Read Article about Compound Index

//But, creating too many indexes also comes with a cost - becomes tough for DB to deal with them

- Why do we need indexes in DB? 
- What are the advantages and disadvantages of indexes? 

    - Create ConnectionRequest schema
    - Send ConnectionRequest API    
    - Proper Validation of data - ALWAYS THINK ABOUT ALL CORNER CASES
    - $or query, and $and query in MongoDB - all logical, comparison etc queries
    - schema.pre("save") function () {} - Pre function

# Episode 13
    - API: /request/review/:status/:requestId : Cover all validations 
    - Read about ref-populate
    - API : /user/requests/received : Do all checks
    - API: /user/connections -> used MongoDB $or query 

# Episode 14
    - API : /feed -> used $or, $and, .select, $nin, $ne
    - Explore other query operators 
    - Pagination: 
        Using Query Params in the URL: 
            /feed?page=1&limit=10: 10 users in 1st page (users 1-10)
                    .skip(0)&.limit(10) -> skip 0, show 10 users

            /feed?page=2&limit=10: 10 users in 2nd page (users 11-20)
                    .skip(10)&.limit(10) -> skip 10 users, show 10 users

            /feed?page=3&limit=10: 10 users in 3rd page (users 21-30)
                    .skip(20)&.liimt(10) -> skip 20 users, show 10 users 
        
        Functions in MongoDB:
            - .limit()-> how many documents do you want
            - .skip()-> how many documents you want to skip from the starting

            Formula for skip:
            (page-1)*limit

# Dev-Finder UI Part 1:
    - Using React.js + Vite (build tool for bundling, provides Templates)
