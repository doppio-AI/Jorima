"use client";

import { useRouter } from "next/navigation";
import {
  FiHome,
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
          <a className={linkClass("inicio")} onClick={() => router.push("/usuarios")}>
            <FiHome size={20} />
            Inicio
          </a>
          <a className={linkClass("historial")} onClick={() => router.push("/historial")}>
            <FiClock size={20} />
            Mi Historial
          </a>
          <a className={linkClass("recursos")} onClick={() => router.push("/recursos")}>
            <FiBookOpen size={20} />
            Recursos de Ayuda
          </a>
        </nav>
      </div>

      <div>
        <a className={linkClass("perfil")} onClick={() => router.push("/perfil")}>
          <FiUser size={20} />
          Mi Perfil
        </a>
        <div className="logout" onClick={logout}>
          <FiLogOut size={20} />
          Cerrar Sesión
        </div>
      </div>
    </aside>
  );
}
