import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/ui";

/**
 * Every admin screen except /admin/login. The shell reads the URL (active nav,
 * breadcrumbs) and redirects guests to sign in, so it renders inside Suspense:
 * admin screens are always rendered on request, never prerendered with data.
 */
// Admin screens are client-rendered behind authentication; there is no static
// shell worth validating for instant navigation.
export const instant = false;

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState />
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
