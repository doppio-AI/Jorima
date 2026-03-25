"use client";

type Usuario = {
  id?: number;
  nombre: string;
  correo: string;
  rol: string;
};

type FormData = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: FormData) => void;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  user: Usuario | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  user,
}: Props) {

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="bg-white p-4">
        <h3>{user ? "Editar usuario" : "Crear usuario"}</h3>

        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, nombre: e.target.value }))
          }
        />

        <input
          placeholder="Correo"
          value={form.correo}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, correo: e.target.value }))
          }
        />

        {!user && (
          <input
            type="password"
            placeholder="Contraseña"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                contrasena: e.target.value,
              }))
            }
          />
        )}

        <select
          value={form.rol}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, rol: e.target.value }))
          }
        >
          <option value="usuario">Tipo 2</option>
          <option value="admin">Admin</option>
        </select>

        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
          <button onClick={() => onSave(form)}>Guardar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}