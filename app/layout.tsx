import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manaleg",
  description: "Gestión de causas judiciales y extrajudiciales",
};

// Corre antes de pintar la página: aplica el tema, la paleta y el movimiento guardados
// para que una recarga no muestre un instante con los valores por defecto.
const SCRIPT_PREPINTADO = `try{var d=document.documentElement,t=localStorage.getItem('theme');d.setAttribute('data-theme',t==='light'?'light':'dark');var p=localStorage.getItem('palette');if(p)d.setAttribute('data-palette',p);if(localStorage.getItem('motion')==='off')d.dataset.motion='off';}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PREPINTADO }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
