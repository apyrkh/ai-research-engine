"use client";

import { useResearchStream } from "@/hooks/useResearchStream";
import { GraphVisualizer } from "@/components/GraphVisualizer";
import { LogPanel } from "@/components/LogPanel";
import { ChatInputPanel } from "@/components/ChatInputPanel";
import { ReportViewer } from "@/components/ReportViewer";

export default function ResearchPage() {
  const { status, steps, errorMessage, finalReport, graphState, submit } = useResearchStream();

  return (
    <div className="flex flex-1 flex-col bg-clinical-bg">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">Research Engine</h1>
      </header>

      <div className="grid flex-1 grid-cols-1 divide-y divide-slate-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Left column */}
        <div className="flex flex-col">
          <section className="flex-1 overflow-auto p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">
              Live Graph Visualization
            </h2>
            <GraphVisualizer
              activeNode={graphState.activeNode}
              completedNodes={graphState.completedNodes}
              conflictNodes={graphState.conflictNodes}
            />
          </section>
          <ChatInputPanel status={status} onSubmit={submit} />
        </div>

        {/* Right column */}
        <div className="flex flex-col overflow-auto">
          <section className="border-b border-slate-800 p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">
              Execution Log
            </h2>
            {errorMessage && (
              <p className="mb-4 rounded-md border border-clinical-collision/50 bg-clinical-collision/10 px-3 py-2 text-sm text-clinical-collision">
                {errorMessage}
              </p>
            )}
            <LogPanel steps={steps} />
          </section>
          <section className="flex-1 p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">
              Final Report
            </h2>
            <ReportViewer finalReport={finalReport} status={status} />
          </section>
        </div>
      </div>
    </div>
  );
}
