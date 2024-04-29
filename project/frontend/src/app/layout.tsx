import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ModalSelector from "@/components/modal/modal-selector";
import { ModalProvider } from "./context/ModalContext";
import { PromptsProvider } from "./context/PromptContext";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal LLM Doc",
  description: "Ask medical questions along with your Personal Health Information (PHI) for personalized insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ModalProvider>
        <PromptsProvider>
          <ModalSelector></ModalSelector>
          <body className={montserrat.className}>{children}</body>
        </PromptsProvider>
      </ModalProvider>
    </html>
  );
}
