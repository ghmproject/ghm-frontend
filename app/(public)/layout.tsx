import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { MobileNav } from "@/components/layout/MobileNav";
import { AppOnboarding } from "@/components/onboarding/AppOnboarding";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { AuthProvider } from "@/providers/AuthProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthBootstrap />
      <SkipToContent />
      <main id="main-content" className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        {children}
      </main>
      <MobileNav />
      <AppOnboarding />
    </AuthProvider>
  );
}
