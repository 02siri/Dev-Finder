const socket = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const { timeStamp } = require("console");

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
        },
    });

    //Need io to receive the connection
    io.on("connection", (socket)=>{
        //handle events

        socket.on("joinChat", ({firstName, userId, targetUserId})=>{
            //We need to create a ROOM in this server with a uniqueId. 
            const roomId = getSecretRoomId(userId, targetUserId);

            console.log(firstName + " Joining Room : "+ roomId);
            socket.join(roomId);
        });

        socket.on("sendMessage", async ({firstName, lastName, userId,targetUserId, text})=> {
            
            //save msg to the db
            try{
                const roomId = getSecretRoomId(userId, targetUserId);
                // console.log(firstName + " " + text);

                //Check if userId and targetUserId are friends?
                const connectionExists = await ConnectionRequest.findOne(
                    {$or: [{
                    fromUserId : userId,
                    toUserId: targetUserId,
                    status: "accepted",
                }, {
                    fromUserId : targetUserId,
                    toUserId: userId,
                    status: "accepted",
                },],}
            );

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