const socket = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");
const mongoose = require("mongoose");
const ConnectionRequest = require("../models/connectionRequest");
const { socketAuth } = require("../middlewares/auth");

const getSecretRoomId = (userId, targetUserId)=>{
    return crypto
    .createHash("sha256")
    .update([userId,targetUserId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
        //server was needed to initalise the socket
    const io = socket(server, {
        //config
        cors : {
            origin: "http://localhost:5173",
            credentials: true, // Crucial for accepting HTTP-only cookies cross-origin
        },
    });

    // Apply JWT token authentication middleware before connection is established
    io.use(socketAuth);

    //Need io to receive the connection
    io.on("connection", (socket)=>{
        // At this point, socket.user is populated and verified by the socketAuth middleware
            //handle events
        socket.on("joinChat", ({ targetUserId })=>{
            // Obtain details from the authenticated user session (for security)
            const userId = socket.user._id.toString();
            const firstName = socket.user.firstName;

            const roomId = getSecretRoomId(userId, targetUserId);

            console.log(firstName + " Joining Room : "+ roomId);
            socket.join(roomId);
        });

        socket.on("sendMessage", async ({ targetUserId, text })=> {
            
            //save msg to the db
            try{
                 // Obtain details securely from authenticated session
                const userId = socket.user._id.toString();
                const firstName = socket.user.firstName;
                const lastName = socket.user.lastName;

                const roomId = getSecretRoomId(userId, targetUserId);
                // console.log(firstName + " " + text);

                if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
                    return socket.emit("error", {
                        message: "Invalid user details",
                    });
                }
                const userObjectId = new mongoose.Types.ObjectId(userId);
                const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);
                // Check if userId and targetUserId are connected friends
                const connectionExists = await ConnectionRequest.findOne({
                    $or: [
                        { fromUserId: userObjectId, toUserId: targetUserObjectId, status: "accepted" },
                        { fromUserId: targetUserObjectId, toUserId: userObjectId, status: "accepted" }
                    ]
                });


             if (!connectionExists) {
                return socket.emit("error", {
                message: "You can only chat with connected users",
                });
            }

                let chat = await Chat.findOne(
                    {               //all the ppl in this array should be the part.
                        participants:{$all:[userId, targetUserId]},
                    }
                );

                //chatting for the first time
                if(!chat){
                    chat = new Chat ({
                        participants:[userId, targetUserId],
                        messages:[],
                    });
                }

                //push the messages
                chat.messages.push({
                    senderId: userId,
                    text,
                });

                await chat.save();
                io.to(roomId).emit("messageReceived", {firstName, lastName, text, timeStamp: new Date()});
            }catch(err){
                console.log(err.message);
            }
            
        });
        
        socket.on("disconnect", ()=>{

        });
        
    });
}

module.exports = initializeSocket;