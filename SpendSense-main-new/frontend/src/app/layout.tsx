import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientWrapper from "./ClientWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SpendSense AI — Premium AI Financial Management & Expense Analytics",
  description: "Advanced AI-powered platform to track expenses, scan OCR bills, analyze investments through Groww, monitor subscriptions and loans with Gemini LLM suggestions.",
  keywords: "expense tracker, AI finance, UPI tracking, bill scanner, investment tracker, budget management",
  openGraph: {
    title: "SpendSense AI — Smart Financial Ecosystem",
    description: "Track, analyze, and optimize your personal finances with AI-powered insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F8FAFC] text-slate-900 min-h-screen antialiased">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
