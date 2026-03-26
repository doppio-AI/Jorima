"use client";

type FormData = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
};

type Usuario = {
  id?: number;
  nombre: string;
  correo: string;
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
      <div className="modal-content">
        <h3>{user ? "Editar usuario" : "Crear usuario"}</h3>

        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Correo</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.correo}
            onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
          />
        </div>

        {!user && (
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.contrasena}
              onChange={(e) => setForm((prev) => ({ ...prev, contrasena: e.target.value }))}
            />
          </div>
        )}

        <div className="form-group">
          <label>Rol</label>
          <select
            value={form.rol}
            onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value }))}
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn-volver" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
