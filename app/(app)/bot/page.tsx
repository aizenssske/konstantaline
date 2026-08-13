import type { Metadata } from "next";
import { BotClient } from "@/components/bot-client";

export const metadata: Metadata = { title: "Telegram bot" };
export default function BotPage() {
  return <BotClient />;
}
