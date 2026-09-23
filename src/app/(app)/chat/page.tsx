import { ChatPage } from "@/components/chat/chat-page";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Chat · Sonnet" };

export default async function Chat() {
  await requireUser();
  return <ChatPage />;
}
