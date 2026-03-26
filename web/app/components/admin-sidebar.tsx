"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./admin-sidebar.module.css";

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.sidebarHeader}>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          <i className={isOpen ? "icon-chevron-left" : "icon-chevron-right"}></i>
        </button>
        {isOpen && <h3>Admin Menu</h3>}
      </div>

      <nav className={styles.sidebarNav}>
        <Link href="/administrador" className={styles.navItem}>
          <i className="icon-home"></i>
          {isOpen && <span>Usuarios</span>}
        </Link>
        <Link href="/administrador/ambiente" className={styles.navItem}>
          <i className="icon-chart"></i>
          {isOpen && <span>Ambiente laboral</span>}
        </Link>
        <Link href="/administrador/reportes" className={styles.navItem}>
          <i className="icon-file"></i>
          {isOpen && <span>Reportes</span>}
        </Link>
        <Link href="/" className={styles.navItem}>
          <i className="icon-arrow-left"></i>
          {isOpen && <span>Volver al inicio</span>}
        </Link>
      </nav>

      <div className={styles.sidebarFooter}>
        {isOpen && <p className={styles.version}>v2.0 Admin</p>}
      </div>
    </aside>
  );
}
