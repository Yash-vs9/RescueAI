import express from "express";
import Message from "../model/Message.js";
import Conversation from "../model/Conversation.js";
import User from "../model/User.js";
import protect from "../middleware/authMiddleware.js"; // Update path based on your structure

const router = express.Router();

// Get all conversations for logged-in user
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email role bloodGroup")
      .sort({ lastMessageTime: -1 });

    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      
      return {
        conversationId: Conversation.generateConversationId(
          conv.participants[0]._id,
          conv.participants[1]._id
        ),
        otherUser,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
router.get("/messages/:otherUserId", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;

    // Verify the other user exists and roles are compatible
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check role compatibility (hospital-donor only)
    if (req.user.role === "donor" && otherUser.role === "donor") {
      return res.status(403).json({ error: "Donors cannot chat with each other" });
    }

    const conversationId = Conversation.generateConversationId(userId, otherUserId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false,
      },
      { isRead: true }
    );

    // Reset unread count
    await Conversation.updateOne(
      { participants: { $all: [userId, otherUserId] } },
      { [`unreadCount.${userId}`]: 0 }
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of users to chat with (for hospitals: donors, for donors: hospitals)
router.get("/available-users", protect, async (req, res) => {
  try {
    const currentUser = req.user;
    
    let query;
    if (currentUser.role === "hospital") {
      // Hospitals can see all donors
      query = { role: "donor" };
    } else if (currentUser.role === "donor") {
      // Donors can see all hospitals
      query = { role: "hospital" };
    } else {
      return res.status(403).json({ error: "Invalid role" });
    }

    const users = await User.find(query)
      .select("name email role bloodGroup location")
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;