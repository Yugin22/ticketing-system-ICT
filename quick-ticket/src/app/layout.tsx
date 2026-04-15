import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Quick Ticket | ICT Support",
  description: "ICT Ticketing System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${jakarta.variable}`}>
      <body className={`min-h-full flex flex-col bg-slate-50 ${jakarta.className}`}>
        {children}
      </body>
    </html>
  );
}