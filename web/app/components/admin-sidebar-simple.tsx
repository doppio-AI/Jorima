"use client"; // Asegúrate de que sea un Client Component

import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";

type AdminSection = "usuarios" | "ambiente" | "reportes";

interface AdminSidebarProps {
  active: AdminSection;
  onLogout?: () => void; // Recibe el logout desde el parent
}

export default function AdminSidebarSimple({ active, onLogout }: AdminSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (onLogout) {
      // Usar la función pasada desde el parent
      onLogout();
      return;
    }

    try {
      // Logout por defecto
      const response = await fetch("/api/auth/login", { method: "DELETE" });

      if (response.ok) {
        localStorage.removeItem("user-data");
        router.push("/login");
        router.refresh();
      } else {
        console.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const getLinkClass = (section: AdminSection) =>
    `sidebar-link ${active === section ? "active" : ""}`.trim();

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">Admin</div>
        <nav>
          <Link className={getLinkClass("usuarios")} href="/administrador">
            Usuarios
          </Link>
          <Link className={getLinkClass("ambiente")} href="/administrador/ambiente">
            Ambiente laboral
          </Link>
          <Link className={getLinkClass("reportes")} href="/administrador/reportes">
            Reportes
          </Link>
        </nav>
      </div>

      <button 
        className="logout-button" 
        onClick={handleLogout} 
        style={{ 
          color: 'white', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginTop: '20px' 
        }}
      >
        <FiLogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  );
}