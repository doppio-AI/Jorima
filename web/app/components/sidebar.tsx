"use client";

import { useState } from "react";
import Sidebar from "../components/sidebar";
import MoodSelector from "../components/moodselector";
import ChatCard from "../components/chatcard";

export default function UsuariosPage() {
  const [mood, setMood] = useState("");

  return (
    <div className="dashboard-container">

      <Sidebar />

      <main className="dashboard-main">

        <div className="dashboard-header">
          <h1>Hola, Jovannyyyy777</h1>
        </div>

        <section className="mood-card">
          <h2>¿Cómo te sientes hoy antes de empezar?</h2>

          <MoodSelector selectedMood={mood} onSelect={setMood} />

          {mood && (
            <p className="mood-thanks">
              ✓ Gracias por compartir cómo te sientes
            </p>
          )}
        </section>

        <ChatCard />

      </main>
    </div>
  );
}