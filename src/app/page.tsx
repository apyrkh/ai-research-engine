import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-clinical-bg">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">AI Research Engine</h1>
      <p className="max-w-md text-center text-sm text-slate-400">
        A deterministic multi-agent research workflow engine with live graph state
        visualization.
      </p>
      <Link
        href="/research"
        className="rounded-md bg-clinical-teal px-5 py-2.5 text-sm font-medium text-slate-50 transition-colors hover:bg-clinical-teal/90"
      >
        Open Research Dashboard →
      </Link>
    </div>
  );
}
