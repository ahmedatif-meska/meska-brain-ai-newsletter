import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default function Loading() {
  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--dashboard-surface)" }}>
      <DashboardNav active="home" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-2/3 rounded-md" style={{ background: "var(--dashboard-track)" }} />
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--dashboard-track)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-full"
                style={{ background: "var(--dashboard-track)" }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 w-1/3 rounded"
                  style={{ background: "var(--dashboard-track)" }}
                />
                <div
                  className="h-3 w-1/2 rounded"
                  style={{ background: "var(--dashboard-track)" }}
                />
              </div>
            </div>
            <div
              className="mt-6 h-2 w-full rounded-full"
              style={{ background: "var(--dashboard-track)" }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
