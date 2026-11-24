import DashboardLayout from "../../../../layout/DashboardLayout";

export default function StudentDashboard() {
  return (
    <DashboardLayout role="STUDENT">
      <div className="p-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Student Dashboard
        </h1>

        <p className="mt-3 text-slate-600">
          Dashboard is rendering successfully!
        </p>
      </div>
    </DashboardLayout>
  );
}