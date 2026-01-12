export type ChatId = string;

export type ChatRole = "user" | "assistant";

export interface Message {
  id: string;
  chatId: ChatId;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatSummary {
  id: ChatId;
  title: string;
  createdAt: string;
}

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};