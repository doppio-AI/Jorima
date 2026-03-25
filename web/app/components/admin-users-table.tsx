"use client";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

export default function AdminUsersTable({
  usuarios,
  onEdit,
  onDelete,
}: {
  usuarios: Usuario[];
  onEdit: (u: Usuario) => void;
  onDelete: (u: Usuario) => void;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {usuarios.map((u) => (
          <tr key={u.id}>
            <td>{u.nombre}</td>
            <td>{u.correo}</td>
            <td>{u.rol}</td>

            <td>
              <button onClick={() => onEdit(u)}>✏️</button>
              <button onClick={() => onDelete(u)}>🗑</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}