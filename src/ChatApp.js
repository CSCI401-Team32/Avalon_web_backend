import React, { useState, useEffect } from "react";
import "./ChatApp.css";
import axios from "axios";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Player 1 is Mordred!", sender: "Player 2" },
    { text: "Player 2 is Mordred!", sender: "Player 1" },
    { text: "No you!", sender: "Player 2" },
  ]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("xxx");
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // Fetch messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (message.trim() !== "") {
      try {
        // Send message to the backend
        await axios.post("xxx", {
          text: message,
          sender: "You",
        });

        // Update local state
        setMessages([...messages, { text: message, sender: "You" }]);
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <div className="chat-app-container">
      {/* Control Bar */}
      <div className="control-bar">{/* Placeholder for control icons */}</div>

      {/* Players Section */}
      <div className="players-section">
        <div className="players-list">
          <div className="player">
            <div className="player-avatar">👩</div>
            Player 1
          </div>
          <div className="player">
            <div className="player-avatar">👨</div>
            Player 2
          </div>
          <div className="player">
            <div className="player-avatar">🐱</div>
            Player 3
          </div>
          <div className="player">
            <div className="player-avatar">👨🏿</div>
            Player 4
          </div>
          <div className="player">
            <div className="player-avatar">🦸</div>
            Player 5
          </div>
          <div className="player">
            <div className="player-avatar">🧙</div>
            Player 6
          </div>
        </div>
        <div className="your-identity">
          <div>You are:</div>
          <div className="identity">Villager</div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">Day 1</div>
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <span className="sender">{msg.sender}: </span>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
