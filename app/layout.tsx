import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Intelligence Dashboard",
  description:
    "Real-time voice intelligence dashboard powered by Deepgram streaming transcription.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
