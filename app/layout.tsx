import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import PlausibleProvider from "next-plausible";
import "./globals.css";
import Image from "next/image";
import bgImage from "../public/new-bg.png";

const montserrat = Montserrat({ subsets: ["latin"] });

let title = "Scholar AI – Personal AI Learning Assistant";
let description = "Learn faster with Scholar AI";
let url = "https://learningassistant.scholarai.co/";
let ogimage = "https://learningassistant.scholarai.co/og-image.png";
let sitename = "scholarai.co";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <PlausibleProvider domain="learningassistant.scholarai.co" />
      </head>

      <body
        className={`${montserrat.className} flex h-full flex-col justify-between text-gray-700 antialiased`}
      >
        <Image
          src={bgImage}
          alt=""
          className="absolute inset-0 -z-10 max-h-full max-w-full blur-[2px]"
        />
        {children}
      </body>
    </html>
  );
}
