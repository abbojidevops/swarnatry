import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://swarnatry.vercel.app"),
  title: "SwarnaTry — AI Virtual Try-On & Gold Estimation Platform",
  description:
    "Luxury bridal & heritage gold virtual AR try-on, 5-piece bridal combo layering, 3D neck-curve warping, old gold trade-in calculations, and live 22K bullion pricing for shoppers and showroom kiosks.",
  keywords: [
    "Gold Try On",
    "Jewelry AR",
    "Gold Price Calculator",
    "Indian Bridal Jewelry",
    "Jhumkas",
    "Choker",
    "Kasu Mala",
    "Virtual Jewelry Try On",
    "Old Gold Exchange",
    "Karigar Order Ledger",
  ],
  authors: [{ name: "SwarnaTry Technologies" }],
  creator: "SwarnaTry",
  publisher: "SwarnaTry",
  openGraph: {
    title: "SwarnaTry — AI Virtual Try-On & Gold Estimation Platform",
    description:
      "Experience luxury heritage jewelry in Live AR, layer 5-piece bridal sets, and estimate live 22K gold costs instantly with goldsmith craftable gram precision.",
    url: "https://swarnatry.vercel.app",
    siteName: "SwarnaTry",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/icon-512.svg",
        width: 512,
        height: 512,
        alt: "SwarnaTry AI Gold Jewelry Virtual Try-On",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwarnaTry — AI Virtual Try-On & Gold Estimation",
    description:
      "Luxury bridal & heritage gold virtual AR try-on and live goldsmith price estimation.",
    images: ["/icon-512.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SwarnaTry",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0B0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian-950 text-ivory antialiased min-h-screen">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if ('serviceWorker' in navigator) {
                  if (!isLocal) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').catch(function() {});
                    });
                  } else {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      for (var i = 0; i < regs.length; i++) {
                        regs[i].unregister();
                      }
                    });
                    if ('caches' in window) {
                      caches.keys().then(function(keys) {
                        for (var i = 0; i < keys.length; i++) caches.delete(keys[i]);
                      });
                    }
                  }
                }
                // Ensure required persistence keys exist in localStorage
                try {
                  if (!localStorage.getItem('swarnatry_catalog')) localStorage.setItem('swarnatry_catalog', '[]');
                  if (!localStorage.getItem('swarnatry_gold_rates')) localStorage.setItem('swarnatry_gold_rates', JSON.stringify({ rate22K: 6850, rate24K: 7470 }));
                  if (!localStorage.getItem('swarnatry_subscription')) localStorage.setItem('swarnatry_subscription', JSON.stringify({ isSubscribed: false, tier: 'free' }));
                  if (!localStorage.getItem('swarnatry_showroom_settings')) localStorage.setItem('swarnatry_showroom_settings', JSON.stringify({ showroomName: 'Sri Swarna Kanchi Jewellers', showroomPhone: '+91 98765 43210', showroomAddress: 'Jeweller Street, T. Nagar, Chennai', showroomGstin: '37AAAAA0000A1Z5' }));
                  if (!localStorage.getItem('swarnatry_admin_settings')) localStorage.setItem('swarnatry_admin_settings', JSON.stringify({ adminPin: '2224', merchantUpiId: 'swarnatry@upi', merchantName: 'SwarnaTry Jewellers SaaS' }));
                } catch(e) {}
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
