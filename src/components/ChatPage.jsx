import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { 
  MessageCircle, Send, Search, Plus, X, Check, CheckCheck,
  Clock, Phone, Video, MoreVertical, ArrowLeft, Loader2,
  Droplets, Heart, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const API_URL = "http://localhost:3000";
  const token = localStorage.getItem("token");

  // Initialize socket connection ONCE
  useEffect(() => {
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      console.log("Received message:", message);
      
      if (
        selectedUser &&
        (message.sender._id === selectedUser._id ||
          message.receiver._id === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
      }

      fetchConversations();
    };

    const handleMessageSent = (message) => {
      console.log("Message sent:", message);
      setMessages((prev) => [...prev, message]);
    };

    const handleUserTyping = ({ userId, isTyping: typingStatus }) => {
      if (selectedUser && userId === selectedUser._id) {
        setIsTyping(typingStatus);
      }
    };

    const handleNewMessageNotification = (data) => {
      console.log("New message notification from:", data.from);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("user_typing", handleUserTyping);
    socket.on("new_message_notification", handleNewMessageNotification);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_typing", handleUserTyping);
      socket.off("new_message_notification", handleNewMessageNotification);
    };
  }, [socket, selectedUser]);

  // Fetch current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Fetch available users
  const fetchAvailableUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/chat/available-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
  }, []);

  // Fetch messages for selected user
  const fetchMessages = async (userId) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/chat/messages/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(data.messages);

      if (socket) {
        socket.emit("mark_as_read", { otherUserId: userId });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Select user to chat with
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowUserList(false);
    fetchMessages(user._id);
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser || !socket) return;

    socket.emit("send_message", {
      receiverId: selectedUser._id,
      message: newMessage,
    });

    setNewMessage("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("typing", { receiverId: selectedUser._id, isTyping: false });
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedUser) return;

    socket.emit("typing", { receiverId: selectedUser._id, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { receiverId: selectedUser._id, isTyping: false });
    }, 1000);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations and users
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="loading-screen">
        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 100%);
          }
          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(193, 64, 61, 0.1);
            border-top-color: #C1403D;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

        :root {
          --cream: #FDF8F3;
          --crimson: #C1403D;
          --terracotta: #E07856;
          --sage: #5A7A6B;
          --forest: #2F4538;
          --sand: #E8DDD0;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .chat-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 50%, #EDE3D8 100%);
          display: flex;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
        }

        .chat-container::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(193, 64, 61, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(90, 122, 107, 0.06) 0%, transparent 50%);
          animation: breathe 25s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(8deg); }
        }

        /* Sidebar */
        .sidebar {
          width: 380px;
          background: rgba(253, 248, 243, 0.9);
          backdrop-filter: blur(30px);
          border-right: 2px solid rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
          box-shadow: 5px 0 30px rgba(47, 69, 56, 0.05);
        }

        .sidebar-header {
          padding: 2rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.8);
          color: var(--sage);
          border-radius: 16px;
          border: 2px solid rgba(90, 122, 107, 0.15);
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .back-button:hover {
          background: white;
          color: var(--crimson);
          transform: translateX(-3px);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.15);
        }

        .sidebar-title {
          font-family: 'Crimson Pro', serif;
          font-size: 2rem;
          font-weight: 800;
          color: var(--forest);
        }

        .new-chat-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          color: white;
          border-radius: 18px;
          border: none;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.25);
        }

        .new-chat-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(193, 64, 61, 0.35);
        }

        .search-container {
          padding: 0 2rem 1rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
        }

        .search-wrapper {
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(90, 122, 107, 0.15);
          border-radius: 18px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--forest);
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          background: white;
          border-color: var(--crimson);
          box-shadow: 0 0 0 4px rgba(193, 64, 61, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--sage);
          opacity: 0.5;
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .conversation-item {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .conversation-item:hover {
          background: white;
          transform: translateX(-3px);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.12);
        }

        .conversation-item.active {
          background: white;
          border-color: var(--crimson);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.2);
        }

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .user-name {
          font-weight: 700;
          font-size: 1rem;
          color: var(--forest);
        }

        .unread-badge {
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          color: white;
          border-radius: 10px;
          padding: 0.25rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .last-message {
          font-size: 0.875rem;
          color: var(--sage);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }

        .user-list-header {
          padding: 1rem 2rem;
          background: rgba(90, 122, 107, 0.1);
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
        }

        .user-list-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .user-item {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-item:hover {
          background: white;
          transform: translateX(-3px);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.12);
        }

        .blood-group-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.15), rgba(224, 120, 86, 0.15));
          border: 2px solid rgba(193, 64, 61, 0.2);
          border-radius: 10px;
          font-family: 'Crimson Pro', serif;
          font-weight: 800;
          font-size: 0.8rem;
          color: var(--crimson);
          margin-top: 0.25rem;
        }

        /* Chat Area */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
        }

        .chat-header {
          padding: 1.5rem 2rem;
          background: rgba(253, 248, 243, 0.9);
          backdrop-filter: blur(30px);
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 5px 30px rgba(47, 69, 56, 0.05);
        }

        .chat-user-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-user-details h3 {
          font-family: 'Crimson Pro', serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--forest);
          margin-bottom: 0.25rem;
        }

        .chat-user-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--sage);
          font-weight: 600;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--sage);
          font-style: italic;
          margin-top: 0.25rem;
        }

        .typing-dots {
          display: flex;
          gap: 0.25rem;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--sage);
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .chat-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          width: 42px;
          height: 42px;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(90, 122, 107, 0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sage);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: white;
          color: var(--crimson);
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.15);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-wrapper {
          display: flex;
        }

        .message-wrapper.sent {
          justify-content: flex-end;
        }

        .message-wrapper.received {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 65%;
          padding: 1rem 1.25rem;
          border-radius: 20px;
          position: relative;
          animation: messageSlide 0.3s ease;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-bubble.sent {
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          color: white;
          border-bottom-right-radius: 5px;
        }

        .message-bubble.received {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          color: var(--forest);
          border-bottom-left-radius: 5px;
          box-shadow: 0 5px 20px rgba(47, 69, 56, 0.08);
        }

        .message-text {
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.8;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.25rem;
        }

        .message-input-container {
          padding: 1.5rem 2rem;
          background: rgba(253, 248, 243, 0.9);
          backdrop-filter: blur(30px);
          border-top: 2px solid rgba(255, 255, 255, 0.5);
        }

        .message-input-wrapper {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(90, 122, 107, 0.15);
          border-radius: 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--forest);
          outline: none;
          transition: all 0.3s ease;
          resize: none;
          max-height: 120px;
        }

        .message-input:focus {
          background: white;
          border-color: var(--crimson);
          box-shadow: 0 0 0 4px rgba(193, 64, 61, 0.1);
        }

        .send-button {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          color: white;
          border: none;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.25);
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(193, 64, 61, 0.35);
        }

        .send-button:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.1), rgba(224, 120, 86, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .empty-title {
          font-family: 'Crimson Pro', serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--forest);
          margin-bottom: 0.5rem;
        }

        .empty-subtitle {
          font-size: 1rem;
          color: var(--sage);
          font-weight: 500;
        }

        .conversations-list::-webkit-scrollbar,
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .conversations-list::-webkit-scrollbar-track,
        .messages-container::-webkit-scrollbar-track {
          background: rgba(90, 122, 107, 0.05);
          border-radius: 10px;
        }

        .conversations-list::-webkit-scrollbar-thumb,
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(193, 64, 61, 0.3);
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            position: absolute;
            left: ${selectedUser ? '-100%' : '0'};
            transition: left 0.3s ease;
          }

          .chat-area {
            width: 100%;
          }

          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="header-top">
            <button onClick={() => navigate('/')} className="back-button">
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          </div>
          <h2 className="sidebar-title">Messages</h2>
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="new-chat-btn"
          >
            {showUserList ? <X size={20} /> : <Plus size={20} />}
            <span>{showUserList ? 'Close' : 'New Chat'}</span>
          </button>
        </div>

        <div className="search-container">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {showUserList ? (
          <div className="conversations-list">
            <div className="user-list-header">
              <h3 className="user-list-title">
                Available {currentUser.role === "hospital" ? "Donors" : "Hospitals"}
              </h3>
            </div>
            <div style={{ padding: '0 1rem' }}>
              {filteredUsers.map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSelectUser(user)}
                  className="user-item"
                >
                  <div className="user-name">{user.name}</div>
                  {user.role === "donor" && user.bloodGroup && (
                    <span className="blood-group-badge">{user.bloodGroup}</span>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--sage)', marginTop: '0.25rem', fontWeight: 600 }}>
                    {user.role === "donor" ? "Donor" : "Hospital"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="conversations-list">
            <AnimatePresence>
              {filteredConversations.map((conv) => (
                <motion.div
                  key={conv.conversationId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onClick={() => handleSelectUser(conv.otherUser)}
                  className={`conversation-item ${
                    selectedUser?._id === conv.otherUser._id ? "active" : ""
                  }`}
                >
                  <div className="conversation-header">
                    <div style={{ flex: 1 }}>
                      <div className="user-name">{conv.otherUser.name}</div>
                      <div className="last-message">{conv.lastMessage}</div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-user-details">
                  <h3>{selectedUser.name}</h3>
                  <div className="chat-user-meta">
                    <span>{selectedUser.role === "donor" ? "Donor" : "Hospital"}</span>
                    {selectedUser.bloodGroup && (
                      <>
                        <span>•</span>
                        <span className="blood-group-badge">{selectedUser.bloodGroup}</span>
                      </>
                    )}
                  </div>
                  {isTyping && (
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                      <span>typing...</span>
                    </div>
                  )}
                </div>
                {/* <div className="chat-actions">
                  <button className="action-btn" title="Call">
                    <Phone size={20} />
                  </button>
                  <button className="action-btn" title="Video Call">
                    <Video size={20} />
                  </button>
                  <button className="action-btn" title="More">
                    <MoreVertical size={20} />
                  </button>
                </div> */}
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              <AnimatePresence>
                {messages.map((msg) => {
                  const isSent = msg.sender._id === currentUser._id;
                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`message-wrapper ${isSent ? "sent" : "received"}`}
                    >
                      <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isSent && <CheckCheck size={16} />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="message-input-container">
              <div className="message-input-wrapper">
                <textarea
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="message-input"
                  rows="1"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!newMessage.trim()}
                >
                  <Send size={22} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <MessageCircle size={50} style={{ color: 'var(--crimson)' }} />
            </div>
            <h3 className="empty-title">Select a Conversation</h3>
            <p className="empty-subtitle">
              Choose from your existing conversations or start a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;