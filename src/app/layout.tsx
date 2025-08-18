import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theming/theme-provider";
import Navbar from "@/components/navigation/navbar";
import { getUser } from "@/lib/auth-utils";
import TermsAndConditionsWrapper from "@/components/account-setup/terms-and-conditions-wrapper";
import IgnPromptWrapper from "@/components/account-setup/ign-prompt-wrapper";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/providers/react-query-provider";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${robotoSans.variable} antialiased`}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="w-full flex justify-center items-center flex-col p-0 h-screen">
              <div className="flex w-full items-center justify-center md:mt-4">
                <Navbar />
              </div>
              {children}
              {user && !user.acceptedTerms && <TermsAndConditionsWrapper />}
              {user && user.acceptedTerms && !user.ign && <IgnPromptWrapper />}
            </div>
          </ThemeProvider>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
