import React, { useState, useEffect, useRef } from "react";
import "./ChatApp.css";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState("Player1");
  const ws = useRef(null);
  const [round, setRound] = useState(1);
  const [alerts, setAlerts] = useState(true);

  // Initialize WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/avalon");

    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log(newMessage);
      if (newMessage.sender !== newMessage.recipient) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
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
    const parts = message.split("*");
    if (message.trim() !== "" && ws.current.readyState === WebSocket.OPEN) {
      let newMessage = {};
      if (round === 1) {
        newMessage = {
          text: message,
          sender: "Player1",
          recipient: "Everyone",
          turn: 1,
          timestamp: new Date().toISOString(),
          visible_to: ["You"],
          msg_type: "chat",
          Think: parts[0] || "",
          Speak: parts[1] || "",
          content: parts[1] || "",
        };
        setRound(2);
      } else if (round === 2) {
        newMessage = {
          text: message,
          sender: "Player1",
          recipient: "Everyone",
          turn: 1,
          timestamp: new Date().toISOString(),
          visible_to: ["You"],
          msg_type: "chat",
          Merlin: parts[0] || "",
          Percival: parts[1] || "",
          "Loyal Servant": parts[2] || "",
          Morgana: parts[3] || "",
          Assassin: parts[4] || "",
        };
        setRound(3);
      } else if (round === 3) {
        newMessage = {
          text: message,
          sender: "Player1",
          recipient: "Everyone",
          turn: 1,
          timestamp: new Date().toISOString(),
          visible_to: ["You"],
          msg_type: "chat",
          Think: parts[0] || "",
          team: parts[1] || "",
          Speak: parts[2] || "",
          content: parts[2] || "",
        };
        setRound(1); // Reset back to round 1
      }

      ws.current.send(JSON.stringify(newMessage));
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage(""); // Clear the input field
      setAlerts(true); // Enable alerts for the next round
    }
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  const filteredMessages = messages.filter(
    (msg) => msg.recipient === selectedPlayer || msg.recipient === "Everyone"
  );

  return (
    <div className="chat-app-container">
      {/* Players Section */}
      <div className="players-section">
        <div className="players-list">
          {[
            "👩 Player1",
            "👨 Player2",
            "🐱 Player3",
            "👨🏿 Player4",
            "🦸 Player5",
          ].map((player, index) => (
            <div
              key={index}
              className={`player ${
                selectedPlayer === player.split(" ")[1] ? "selected" : ""
              }`}
              onClick={() => handlePlayerSelect(player.split(" ")[1])}
            >
              <div className="player-avatar">{player.split(" ")[0]}</div>
              {player.split(" ")[1]}
            </div>
          ))}
        </div>
        <div className="your-identity">
          <div>You are:</div>
          <div className="identity">Player 1</div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">Chat with {selectedPlayer}</div>
        <div className="chat-messages">
          {filteredMessages.map((msg, index) => (
            <div key={index}>
              <span className="sender">{msg.sender}</span> to{" "}
              <span className="recipient">{msg.recipient}</span>:
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
