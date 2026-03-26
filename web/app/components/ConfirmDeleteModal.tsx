"use client";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: Usuario | null;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  user,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar a <strong>{user?.nombre}</strong>?</p>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end" }}>
          <button className="btn-volver" onClick={onClose}>Cancelar</button>
          <button
            style={{ background: "#DC2626", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
