import "./globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Packster</title>
        <link rel="icon" type="image/png" href="/backpack.png" />
        <link rel="apple-touch-icon" href="/backpack.png" />
        <meta name="theme-color" content="#22aeff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
