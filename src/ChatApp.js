import React, { useState, useEffect, useRef } from "react";
import "./ChatApp.css";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/avalon");

    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    ws.current.onclose = () => {
      console.error("WebSocket connection closed");
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim() !== "" && ws.current.readyState === WebSocket.OPEN) {
      const newMessage = {
        text: message,
        sender: "You",
        recipient: "Everyone", // Modify as needed
        turn: 1, // Example turn value
        timestamp: new Date().toISOString(),
        visible_to: ["You"],
        msg_type: "chat",
      };

      ws.current.send(JSON.stringify(newMessage));
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    }
  };

  return (
    <div className="chat-app-container">
      {/* Control Bar */}
      <div className="control-bar">{/* Placeholder for control icons */}</div>

      {/* Players Section */}
      <div className="players-section">
        <div className="players-list">
          {["👩 Player1", "👨 Player2", "🐱 Player3", "👨🏿 Player4", "🦸 Player5", "🧙 Player6"].map(
            (player, index) => (
              <div key={index} className="player">
                <div className="player-avatar">{player.split(" ")[0]}</div>
                {player.split(" ")[1]}
              </div>
            )
          )}
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
            <div key={index}>
              <span className="sender">{msg.sender}</span> to <span className="recipient">{msg.recipient}</span>:
              <span className="content"> {msg.content}</span>
              <span className="metadata">
                (Turn: {msg.turn}, Timestamp: {msg.timestamp})
              </span>
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
