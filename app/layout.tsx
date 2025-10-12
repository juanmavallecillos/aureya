import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--font-serif" });

export const metadata = {
  title: "Aureya — Comparador de Oro y Plata",
  description:
    "Aureya: tu guía en metales preciosos. Compara precios y primas vs spot en oro y plata de las principales tiendas europeas.",
  openGraph: {
    type: "website",
    title: "Aureya — Comparador de Oro y Plata",
    description:
      "Compara precios y primas vs spot en oro y plata. Datos cacheados en CDN. Donde el valor brilla.",
    url: "https://aureya.es",
  },
  metadataBase: new URL("https://aureya.es"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${inter.variable} ${playfair.variable} min-h-dvh flex flex-col bg-white text-zinc-900 antialiased`}
      >
        <SpeedInsights/>
        <Analytics />
        <SiteHeader />

        <div className="flex-1">
          <div className="page-container">
            <main className="py-6">
              <Breadcrumbs />
              {children}
            </main>
          </div>
        </div>

        <SiteFooter />
      </body>
    </html>
  );
}
