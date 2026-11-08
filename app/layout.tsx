import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "PacePrincess AI: run with your cycle",
  description: "Running training that adapts to your menstrual cycle phase.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1120" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="footer">
          <div className="container row" style={{ justifyContent: "space-between" }}>
            <span>© {new Date().getFullYear()} PacePrincess AI</span>
            <span>Training guidance, not medical advice.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
