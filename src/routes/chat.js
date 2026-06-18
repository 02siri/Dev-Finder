const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");


const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId",userAuth, async (req,res)=>{
    const {targetUserId} = req.params;
    const userId = req.user._id;


    try{    

                const connectionExists = await ConnectionRequest.findOne({
            $or: [
                {
                    fromUserId: userId,
                    toUserId: targetUserId,
                    status: "accepted",
                },
                {
                    fromUserId: targetUserId,
                    toUserId: userId,
                    status: "accepted",
                },
            ],
        });

        if (!connectionExists) {
            return res.status(403).json({
                message: "You can only access chats with connected users",
            });
        }

        let chat = await Chat.findOne({
            participants: {$all: [userId, targetUserId]},
        }).populate({
            path: "messages.senderId",
            select: "firstName lastName emailId"
        });

        if(!chat){
            chat = new Chat ({
                    participants:[userId, targetUserId],
                    messages:[],
              });
         await chat.save();
        }

        res.json(chat);
        
    }catch(err){
        console.log(err.message);
    }
});

module.exports = chatRouter;