"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StreamStatus } from "@/lib/types/research";

export interface ReportViewerProps {
  finalReport: string | null;
  status: StreamStatus;
}

const markdownComponents: Components = {
  h1: (props) => <h1 className="mb-3 text-xl font-semibold text-slate-100" {...props} />,
  h2: (props) => <h2 className="mb-2 mt-4 text-lg font-semibold text-slate-100" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-3 text-base font-semibold text-slate-100" {...props} />,
  p: (props) => <p className="mb-2 text-sm leading-relaxed text-slate-300" {...props} />,
  ul: (props) => <ul className="mb-2 list-disc pl-5 text-sm text-slate-300" {...props} />,
  ol: (props) => <ol className="mb-2 list-decimal pl-5 text-sm text-slate-300" {...props} />,
  li: (props) => <li className="mb-1" {...props} />,
  code: (props) => (
    <code className="rounded bg-slate-800 px-1 py-0.5 text-xs text-clinical-cyan" {...props} />
  ),
  table: (props) => (
    <div className="mb-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm text-slate-300" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border border-slate-700 px-2 py-1 text-left font-medium text-slate-200" {...props} />
  ),
  td: (props) => <td className="border border-slate-700 px-2 py-1" {...props} />,
};

export function ReportViewer({ finalReport, status }: ReportViewerProps) {
  if (!finalReport) {
    return (
      <p className="text-sm text-slate-500">
        {status === "streaming" || status === "connecting"
          ? "Report will render here once generation completes."
          : "No report generated yet."}
      </p>
    );
  }

  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {finalReport}
      </ReactMarkdown>
    </div>
  );
}
