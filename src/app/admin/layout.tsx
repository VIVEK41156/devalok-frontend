import type { Metadata } from "next";
import AuthProvider from "@/components/admin/AuthProvider";
import { AdminFeedbackProvider } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: { default: "Devalok CMS", template: "%s · Devalok CMS" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment text-plum">
      <AuthProvider>
        <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
      </AuthProvider>
    </div>
  );
}
