import type { Metadata } from "next";
import "./globals.css";
import "./onboarding.css";
import "./network.css";

export const metadata: Metadata = {
  title: "Sherara — Agent trust network",
  description: "Discover agents, agree on terms, and inspect testnet evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
