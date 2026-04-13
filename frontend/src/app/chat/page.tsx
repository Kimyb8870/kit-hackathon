"use client";

import { ChatContainer } from "@/components/chat/chat-container";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { useProfileStore } from "@/stores/profile-store";
import { useProfileHydration } from "@/hooks/use-profile-hydration";

export default function ChatPage() {
  const isOnboarded = useProfileStore((s) => s.isOnboarded);
  const profileHydrated = useProfileHydration();

  return (
    <div className="flex flex-1 flex-col">
      <ChatContainer />
      {profileHydrated && <OnboardingModal open={!isOnboarded} />}
    </div>
  );
}
