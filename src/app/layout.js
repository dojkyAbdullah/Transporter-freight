import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Toaster from "./components/Toaster";
import OfflineBanner from "./components/OfflineBanner";
import PwaRegister from "./components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Freight Collection",
  description: "Freight collection and RFQ portal – works offline",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Freight",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OfflineBanner />
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
