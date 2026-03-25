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
      <div className="bg-white p-4">
        <p>¿Eliminar a {user?.nombre}?</p>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button onClick={onConfirm}>Eliminar</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}