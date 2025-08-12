import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Navbar from "@/components/navigation/navbar";

const robotoSans = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto-sans",
});

export const metadata: Metadata = {
  title: "Growtopia PVP",
  description:
    "Minimal app to track Growtopia PVP duels and match scores with an ELO system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${robotoSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="w-full flex justify-center items-center flex-col p-0">
            <div className="flex w-full items-center justify-center md:mt-4">
              <Navbar />
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
