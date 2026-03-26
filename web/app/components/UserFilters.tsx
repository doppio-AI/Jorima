"use client";

type Filtro = "todos" | "usuario" | "admin";

interface Props {
  filtro: Filtro;
  setFiltro: React.Dispatch<React.SetStateAction<Filtro>>;
}

export default function UserFilters({ filtro, setFiltro }: Props) {
  const options: { label: string; value: Filtro }[] = [
    { label: "Todos", value: "todos" },
    { label: "Usuarios", value: "usuario" },
    { label: "Administradores", value: "admin" },
  ];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={filtro === opt.value ? "btn-primary" : "btn-volver"}
          style={{ fontSize: "0.85rem" }}
          onClick={() => setFiltro(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
