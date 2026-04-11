import "./globals.css";
import ThemeFontControls from "@/app/components/ThemeFontControls";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="es" suppressHydrationWarning>
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

      <body className={inter.variable}>
        {children}

        {/* Panel flotante */}
        <ThemeFontControls />
      </body>
    </html>
  );
}