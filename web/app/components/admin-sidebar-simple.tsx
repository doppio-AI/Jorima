"use client"; // Asegúrate de que sea un Client Component

import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";

type AdminSection = "usuarios" | "ambiente" | "ayuda";

interface AdminSidebarProps {
  active: AdminSection;
  onLogout?: () => void; // Recibe el logout desde el parent
}

export default function AdminSidebarSimple({ active, onLogout }: AdminSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        console.error("Error al cerrar sesión");
      }

      document.cookie =
        "usuario_public=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("user-data");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const getLinkClass = (section: AdminSection) =>
    `sidebar-link ${active === section ? "active" : ""}`.trim();

  return (
    <aside className="sidebar admin-sidebar">
      <div className="admin-sidebar-shell">
        <div className="sidebar-logo admin-sidebar-brand">
          <div>
            <span className="admin-sidebar-eyebrow">Panel</span>
            <strong className="admin-sidebar-title">Administración</strong>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <Link className={getLinkClass("usuarios")} href="/administrador">
            Usuarios
          </Link>
          <Link className={getLinkClass("ambiente")} href="/administrador/ambiente">
            Ambiente laboral
          </Link>
          <Link className={getLinkClass("ayuda")} href="/administrador/ayuda">
            Ayuda y guías
          </Link>
        </nav>
      </div>

      <button 
        className="admin-logout-button"
        onClick={handleLogout}
      >
        <FiLogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
}