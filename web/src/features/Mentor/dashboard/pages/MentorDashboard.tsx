import {
  Users,
  CalendarDays,
  IndianRupee,
  ArrowUpRight,
  Video,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "../../../../layout/DashboardLayout";

const stats = [
  {
    title: "Total Students",
    value: "24",
    description: "8 new this month",
    icon: Users,
  },
  {
    title: "Sessions Completed",
    value: "48",
    description: "This month",
    icon: CheckCircle2,
  },
  {
    title: "Upcoming Sessions",
    value: "06",
    description: "Next 7 days",
    icon: CalendarDays,
  },
  {
    title: "Monthly Earnings",
    value: "₹12,500",
    description: "Dummy earnings",
    icon: IndianRupee,
  },
];

const sessions = [
  {
    student: "Amit Kumar",
    topic: "DSA Interview Preparation",
    date: "Today",
    time: "4:00 PM",
    status: "Upcoming",
  },
  {
    student: "Neha Verma",
    topic: "Backend Development Guidance",
    date: "Tomorrow",
    time: "11:00 AM",
    status: "Upcoming",
  },
  {
    student: "Rohit Singh",
    topic: "Career Guidance",
    date: "Tomorrow",
    time: "3:00 PM",
    status: "Upcoming",
  },
];

const students = [
  { name: "Amit Kumar", course: "Data Structures & Algorithms" },
  { name: "Neha Verma", course: "Backend Development" },
  { name: "Rohit Singh", course: "System Design" },
];

export default function MentorDashboard() {
  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-8">
        {/* Welcome */}
        <section>
          <p className="text-sm font-medium text-violet-600">
            MENTOR OVERVIEW
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Welcome back, Mentor! 👋
          </h1>
          <p className="mt-2 text-slate-500">
            Here's what's happening with your mentorship activities.
          </p>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                    <Icon size={20} />
                  </div>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  {stat.value}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Sessions */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Upcoming Sessions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your scheduled mentorship meetings.
              </p>
            </div>

            <button className="flex items-center gap-1 text-sm font-semibold text-violet-600">
              View all <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.student}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {session.topic}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Student: {session.student}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-sm text-slate-600">
                    <p>{session.date}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.time}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {session.status}
                  </span>

                  <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                    <Video size={16} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Students */}
        <section>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Students
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Students currently connected with you.
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {students.map((student, index) => (
              <div
                key={student.name}
                className={`flex items-center justify-between gap-3 p-5 ${
                  index !== students.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {student.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {student.course}
                  </p>
                </div>

                <button className="text-sm font-semibold text-violet-600">
                  View profile
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Availability */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl bg-violet-600 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Manage your availability</h2>
            <p className="mt-1 text-sm text-violet-100">
              Set your available hours so students can book sessions.
            </p>
          </div>

          <button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50">
            Manage Availability
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}