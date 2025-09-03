import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/app-layout";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://scira-mcp-chat-indol.vercel.app"),
  title: "MCP-UI Playground",
  description: "MCP-UI Playground enables you to experiment with your MCP-UI servers",
  openGraph: {
    siteName: "MCP-UI Playground",
    url: "https://scira-mcp-chat-indol.vercel.app",
    images: [
      {
        url: "https://scira-mcp-chat-indol.vercel.app/twitter-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP-UI Playground",
    description: "MCP-UI Playground enables you to experiment with your MCP-UI servers",
    images: ["https://scira-mcp-chat-indol.vercel.app/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`} suppressHydrationWarning>
        <Providers>
          <AuthGuard>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthGuard>
        </Providers>
        <Analytics />
        <Script defer src="https://cloud.umami.is/script.js" data-website-id="1373896a-fb20-4c9d-b718-c723a2471ae5" />
      </body>
    </html>
  );
}
