import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Archivo, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Archivo for text, Abril Fatface for headings (it has one weight, so headings never get faux bold; see globals.css).
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const abril = Abril_Fatface({ variable: "--font-abril", subsets: ["latin"], weight: "400" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

// Android Chrome: the keyboard shrinks the page instead of covering it (iOS is handled in app-shell).
export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ericwei.me"),
  title: "Sonnet",
  description: "Everything due, how caught up you are, and an AI that knows your courses.",
  openGraph: { type: "website", siteName: "Sonnet", url: "/login" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${abril.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-center" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
