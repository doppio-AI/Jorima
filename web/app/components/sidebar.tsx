"use client";

import { useRouter } from "next/navigation";
import {
  FiClock,
  FiBookOpen,
  FiLogOut,
  FiSmile,
  FiUser,
} from "react-icons/fi";

type SidebarProps = {
  active?: "inicio" | "historial" | "recursos" | "perfil";
};

export default function Sidebar({ active }: SidebarProps) {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch("/api/login", { method: "DELETE" });
      document.cookie =
        "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const linkClass = (section: string) =>
    `sidebar-link ${active === section ? "active" : ""}`.trim();

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <FiSmile size={28} />
          <span>Jorima</span>
        </div>

        <nav>
          <button
  type="button"
  className={linkClass("inicio")}
  onClick={() => router.push("/usuarios")}
>
  Inicio
</button>
          <button className={linkClass("historial")} onClick={() => router.push("/historial")}>
            <FiClock size={20} />
            Mi Historial
          </button>
          <button className={linkClass("recursos")} onClick={() => router.push("/recursos")}>
            <FiBookOpen size={20} />
            Recursos de Ayuda
          </button>
        </nav>
      </div>

      <div>
        <button className={linkClass("perfil")} onClick={() => router.push("/perfil")}>
          <FiUser size={20} />
          Mi Perfil
        </button>
        <div className="logout" onClick={logout}>
          <FiLogOut size={20} />
          Cerrar Sesión
        </div>
      </div>
    </aside>
  );
}
