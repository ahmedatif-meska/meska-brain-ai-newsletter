import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--dashboard-surface)" }}>
      <DashboardNav active="profile" />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <div
          className="rounded-2xl border p-6 sm:p-8 animate-pulse"
          style={{ borderColor: "var(--dashboard-track)" }}
        >
          <div className="space-y-6">
            <div
              className="h-6 w-1/2 rounded"
              style={{ background: "var(--dashboard-track)" }}
            />
            <div
              className="h-4 w-3/4 rounded"
              style={{ background: "var(--dashboard-track)" }}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
              <div
                className="h-12 rounded-xl"
                style={{ background: "var(--dashboard-track)" }}
              />
              <div
                className="h-12 rounded-xl"
                style={{ background: "var(--dashboard-track)" }}
              />
              <div
                className="h-12 rounded-xl sm:col-span-2"
                style={{ background: "var(--dashboard-track)" }}
              />
              <div
                className="h-12 rounded-xl sm:col-span-2"
                style={{ background: "var(--dashboard-track)" }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
