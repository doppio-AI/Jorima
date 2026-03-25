"use client";

type Filtro = "todos" | "usuario" | "admin";

interface Props {
  setFiltro: React.Dispatch<React.SetStateAction<Filtro>>;
}

export default function UserFilters({ setFiltro }: Props) {
  return (
    <div>
      <button onClick={() => setFiltro("todos")}>Todos</button>
      <button onClick={() => setFiltro("usuario")}>Tipo 2</button>
      <button onClick={() => setFiltro("admin")}>Admin</button>
    </div>
  );
}