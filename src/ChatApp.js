import React, { useState, useEffect, useRef } from "react";
import "./ChatApp.css";

function ChatApp() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const [round, setRound] = useState(1);
  const [alerts, setAlerts] = useState(true);
  // Initialize WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/avalon");

    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      if (
        newMessage.recipient === "Everyone" ||
        newMessage.recipient === "Player1"
      ) {
        console.log("Received message:", newMessage);
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

  useEffect(() => {
    if (alerts) {
      if (round === 1) {
        alert(
          "Type your Think and Speak in the following format: {Think}*{Speak}"
        );
        setAlerts(false);
      } else if (round === 2) {
        alert(
          "Type your Merlin, Percival, Loyal Servant, Morgana, and Assassin in the following format: {Merlin}*{Percival}*{Loyal Servant}*{Morgana}*{Assassin}"
        );
      } else if (round === 3) {
        alert(
          "Type your Think, team, and Speak in the following format: {Think}*{team}*{Speak}"
        );
      }
      setAlerts(false);
    }
  }, [round, alerts]);

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
          sender: "You",
          recipient: "Everyone",
          turn: 1,
          timestamp: new Date().toISOString(),
          visible_to: ["You"],
          msg_type: "chat",
          Think: parts[0] || "",
          Speak: parts[1] || "",
        };
        setRound(2);
      } else if (round === 2) {
        newMessage = {
          text: message,
          sender: "You",
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
          sender: "You",
          recipient: "Everyone",
          turn: 1,
          timestamp: new Date().toISOString(),
          visible_to: ["You"],
          msg_type: "chat",
          Think: parts[0] || "",
          team: parts[1] || "",
          Speak: parts[2] || "",
        };
        setRound(1); // Reset back to round 1
      }

      console.log(newMessage);
      ws.current.send(JSON.stringify(newMessage));
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage(""); // Clear the input field
      setAlerts(true); // Enable alerts for the next round
    }
  };

  return (
    <div className="chat-app-container">
      {/* Control Bar */}
      <div className="control-bar">{/* Placeholder for control icons */}</div>

      {/* Players Section */}
      <div className="players-section">
        <div className="players-list">
          {[
            "👩 Player1",
            "👨 Player2",
            "🐱 Player3",
            "👨🏿 Player4",
            "🦸 Player5",
            "🧙 Player6",
          ].map((player, index) => (
            <div key={index} className="player">
              <div className="player-avatar">{player.split(" ")[0]}</div>
              {player.split(" ")[1]}
            </div>
          ))}
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
