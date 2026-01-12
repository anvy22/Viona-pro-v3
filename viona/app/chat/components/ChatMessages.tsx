import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-6 py-4 text-lg leading-relaxed shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-wrap break-words font-normal tracking-wide">
          {message.content}
        </div>
      </div>

    
    </div>
  );
}