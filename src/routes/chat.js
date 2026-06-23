const express = require("express");
const { userAuth } = require("../middlewares/auth");
const mongoose = require("mongoose");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user IDs" });
        }
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);

        const connectionExists = await ConnectionRequest.findOne({
            $or: [
                {
                    fromUserId: userObjectId,
                    toUserId: targetUserObjectId,
                    status: "accepted",
                },
                {
                    fromUserId: targetUserObjectId,
                    toUserId: userObjectId,
                    status: "accepted",
                },
            ],
        });

        if (!connectionExists) {
            return res.status(403).json({
                message: "You can only access chats with connected users",
            });
        }

        // Get total number of messages in the conversation by selecting only the array IDs
        const chatInfo = await Chat.findOne({
            participants: { $all: [userObjectId, targetUserObjectId] }
        }).select("messages._id").lean();

        const totalMessages = chatInfo ? chatInfo.messages.length : 0;

        // Calculate limits and slices
        const skip = Math.max(0, totalMessages - page * limit);
        const currentLimit = Math.min(limit, totalMessages - (page - 1) * limit);

        let chat = null;

        if (totalMessages > 0 && (page - 1) * limit < totalMessages) {
            chat = await Chat.findOne(
                { participants: { $all: [userObjectId, targetUserObjectId] } },
                { messages: { $slice: [skip, currentLimit] } }
            ).populate({
                path: "messages.senderId",
                select: "firstName lastName emailId photoURL"
            }).populate({
                path: "participants",
                select: "firstName lastName emailId photoURL"
            });
        }

        if (!chat) {
            // Handle scenario when chat hasn't been created yet or is empty
            const existingChat = await Chat.findOne({
                participants: { $all: [userObjectId, targetUserObjectId] }
            }).populate({
                path: "participants",
                select: "firstName lastName emailId photoURL"
            });

            if (!existingChat) {
                chat = new Chat({
                    participants: [userObjectId, targetUserObjectId],
                    messages: [],
                });
                await chat.save();
                
                chat = await Chat.findById(chat._id).populate({
                    path: "participants",
                    select: "firstName lastName emailId photoURL"
                });
            } else {
                chat = existingChat.toObject();
                chat.messages = [];
            }
        }

        const chatObj = chat.toObject ? chat.toObject() : chat;

        res.json({
            ...chatObj,
            totalMessages,
            hasMore: skip > 0
        });

    } catch (err) {
        console.log(err.message);
        res.status(400).json({ message: "ERROR: " + err.message });
    }
});

module.exports = chatRouter;