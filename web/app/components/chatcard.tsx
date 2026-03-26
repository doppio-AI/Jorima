"use client";

import React, { useState } from "react";

interface Message {
  sender: "assistant" | "user";
  text: string;
}

const ChatCard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "¡Hola! Soy tu asistente virtual de bienestar. Estoy aquí para escucharte y ayudarte. ¿Hay algo en lo que pueda apoyarte hoy?"
    }
  ]);

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      { sender: "user", text: input }
    ]);

    setInput("");
  };

  return (
    <section className="chat-card">
      <div>
        <h2>Chat Privado y Seguro</h2>
        <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
          Tus conversaciones son confidenciales
        </p>
      </div>

      {messages.map((msg, idx) => (
        <div key={idx} className={`chat-message ${msg.sender}`}>
          {msg.text}
        </div>
      ))}

      <div className="chat-input">
        <input
          type="text"
          placeholder="Escribe tu mensaje aquí..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </section>
  );
};

export default ChatCard;
