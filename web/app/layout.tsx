import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jorima",
  description: "Plataforma de Bienestar Laboral",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}