import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/providers";
import LenisProvider from "@/components/lenis-provider";
import { SessionProvider } from "@/components/SessionProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScoPPi",
  description: "Планировщик соревнований для ФСП",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >

          <LenisProvider>
          <SessionProvider>{children}</SessionProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}