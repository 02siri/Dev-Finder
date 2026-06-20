const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
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



       // Get total number of messages in the conversation by selecting only the array IDs
        const chatInfo = await Chat.findOne({
            participants: { $all: [userId, targetUserId] }
        }).select("messages._id").lean();
        const totalMessages = chatInfo ? chatInfo.messages.length : 0;

        // Calculate limits and slices
        const skip = Math.max(0, totalMessages - page * limit);
        const currentLimit = Math.min(limit, totalMessages - (page - 1) * limit);

        let chat = null;

        if (totalMessages > 0 && (page - 1) * limit < totalMessages) {
            chat = await Chat.findOne(
                { participants: { $all: [userId, targetUserId] } },
                { messages: { $slice: [skip, currentLimit] } }
            ).populate({
                path: "messages.senderId",
                select: "firstName lastName"
            });
        }

        if (!chat) {
            // Handle scenario when chat hasn't been created yet or is empty
            const existingChat = await Chat.findOne({
                participants: { $all: [userId, targetUserId] }
            });

            if (!existingChat) {
                chat = new Chat({
                    participants: [userId, targetUserId],
                    messages: [],
                });
                await chat.save();
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