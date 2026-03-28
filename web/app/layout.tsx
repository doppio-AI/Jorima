import "./globals.css";
import ThemeFontControls from "@/app/components/ThemeFontControls";

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

        {/* Evita flash de tema incorrecto */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('jorima_theme') || 'light';
                  const scale = localStorage.getItem('jorima_font_scale') || '1';

                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.setProperty('--font-scale', scale);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>

      <body>
        {children}

        {/* Panel flotante */}
        <ThemeFontControls />
      </body>
    </html>
  );
}