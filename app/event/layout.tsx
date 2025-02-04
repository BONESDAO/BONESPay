import type { Metadata } from "next";
import "@/app/globals.css";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { Background } from "@/components/ui/backgroud";
import { WalletProvider } from "./context/WalletContext";
import { Toaster } from "@/components/ui/toaster";
import localFont from "next/font/local";
import ScrollingLogoBanner from "@/components/ScrollingLogo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "跳格子大冒险",
  description: "跳格子大冒险——探索PlatON生态里程，赢取惊喜奖励！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={cn(
        `${geistSans.variable} ${geistMono.variable} min-h-screen antialiased overflow-y-auto scrollbar-hide`
      )}
    >
      <WalletProvider>
          <ScrollingLogoBanner />
          <div className="w-full min-h-[6vh]">
            <Navbar />
          </div>
          <Background />
          {children}
          <Toaster />
        </WalletProvider>
    </div>
  );
}
