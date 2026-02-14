import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../context/Web3Context";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "On-Chain Governance",
    description: "Decentralized Voting Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Web3Provider>
                    <div className="min-h-screen bg-background text-white">
                        <Navbar />
                        <main className="container mx-auto p-4">{children}</main>
                    </div>
                </Web3Provider>
            </body>
        </html>
    );
}
