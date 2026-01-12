"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatInput({
  onSend,
}: {
  onSend: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="relative flex items-end gap-3 rounded-3xl bg-background shadow-lg border border-border p-3">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask anything about your business"
          rows={1}
          className="flex-1 resize-none bg-transparent px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none max-h-52 overflow-y-auto"
          style={{
            minHeight: "32px",
            maxHeight: "200px"
          }}
        />

        <button
          onClick={submit}
          disabled={!value.trim()}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
            value.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Send className="h-6 w-6" />
        </button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-3">
        Viona can make mistakes. Check important info.
      </p>
    </div>
  );
}