"use client";

import { useState, type ReactNode } from "react";
import { useResearchStream } from "@/hooks/useResearchStream";
import { GraphVisualizer } from "@/components/GraphVisualizer";
import { LogPanel } from "@/components/LogPanel";
import { ChatInputPanel } from "@/components/ChatInputPanel";
import { ReportViewer } from "@/components/ReportViewer";
import { ActiveQueryHeader } from "@/components/ActiveQueryHeader";
import type { RightPanelTab } from "@/lib/types/research";

export default function ResearchPage() {
  const { status, steps, errorMessage, finalReport, graphState, activeQuery, submit } =
    useResearchStream();
  const [activeTab, setActiveTab] = useState<RightPanelTab>("log");

  function handleSubmit(topic: string) {
    setActiveTab("log");
    submit(topic);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-clinical-bg">
      <header className="shrink-0 border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">Research Engine</h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Left column: graph fills available space, input panel pinned to the bottom */}
        <div className="flex min-h-0 flex-col">
          <section className="min-h-0 flex-1 overflow-y-auto p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">
              Live Graph Visualization
            </h2>
            <GraphVisualizer
              activeNode={graphState.activeNode}
              completedNodes={graphState.completedNodes}
              conflictNodes={graphState.conflictNodes}
            />
          </section>
          <div className="shrink-0 border-t border-slate-800">
            <ChatInputPanel status={status} onSubmit={handleSubmit} />
          </div>
        </div>

        {/* Right column: independently scrollable, never affects the left column's layout */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 border-b border-slate-800">
            <TabButton active={activeTab === "log"} onClick={() => setActiveTab("log")}>
              Execution Log
            </TabButton>
            <TabButton active={activeTab === "report"} onClick={() => setActiveTab("report")}>
              Final Report
              {finalReport && (
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-clinical-success" />
              )}
            </TabButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {activeTab === "log" ? (
              <>
                {activeQuery && <ActiveQueryHeader query={activeQuery} />}
                {errorMessage && (
                  <p className="mb-4 rounded-md border border-clinical-collision/50 bg-clinical-collision/10 px-3 py-2 text-sm text-clinical-collision">
                    {errorMessage}
                  </p>
                )}
                <LogPanel steps={steps} status={status} />
                {finalReport && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("report")}
                    className="mt-4 w-full rounded-md bg-clinical-teal px-4 py-2 text-sm font-medium text-slate-50 transition-colors hover:bg-clinical-teal/90"
                  >
                    View Final Research Report →
                  </button>
                )}
              </>
            ) : (
              <ReportViewer finalReport={finalReport} status={status} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-b-2 border-clinical-cyan text-slate-100"
          : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
