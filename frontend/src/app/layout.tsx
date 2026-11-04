import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/tokens.css";
import { ToastProvider } from "@/components/ui/Toast";
import CommandPalette from "@/components/ui/CommandPalette";
import LandingBackground from "@/components/landing/LandingBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhyloLoom AI — Biological Investigation Engine",
  description:
    "Reproducible computational genomics workspace: sequence analysis, mutation investigation, evolutionary anomaly detection, and evidence-linked hypotheses. Research support only, not clinical diagnosis.",
};

const THEME_SCRIPT = `
try {
  var t = localStorage.getItem("phyloloom-theme");
  if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = t;
} catch (e) {
  document.documentElement.dataset.theme = "light";
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <LandingBackground />
        {children}
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}