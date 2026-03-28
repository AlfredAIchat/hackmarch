import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alfred AI — Recursive Learning Engine",
  description: "An 11-agent AI pipeline that enables infinite-depth recursive learning through knowledge exploration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Sora:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-canvas text-primary">
        {children}
      </body>
    </html>
  );
}
