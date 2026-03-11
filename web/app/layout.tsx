import "./globals.css";

export const metadata = {
  title: "Jorima",
  description: "Plataforma de bienestar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.lineicons.com/4.0/lineicons.css"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}