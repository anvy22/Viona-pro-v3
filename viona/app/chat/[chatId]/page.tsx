"use client";

import { useParams, useRouter } from "next/navigation";
import DesktopSidebar from "@/components/DesktopSidebar";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { SearchBar } from "@/components/SearchBar";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const router = useRouter();

    return (
        <div className="flex h-screen overflow-hidden">
            <DesktopSidebar />

            <div className="flex flex-col flex-1 min-h-0">
                {/* HEADER */}
                <header className="flex items-center justify-between px-6 py-4 h-[50px] gap-4">
                    <BreadcrumbHeader />
                    <SearchBar />
                    <NotificationDropdown />
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </header>

                <Separator />

                {/* CONTENT */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <div >
                        <div className=" flex items-center justify-between gap-5 mt-5 ml-5 mr-5">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push("/chat/history")}
                            >
                                <History className="h-4 w-4 mr-2" />
                                See history
                            </Button>
                        </div>
                    </div>

                    <ChatWindow chatId={chatId} />
                </div>
            </div>
        </div>
    );
}
