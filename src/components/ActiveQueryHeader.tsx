"use client";

import { useState } from "react";

export interface ActiveQueryHeaderProps {
  query: string;
}

const TRUNCATE_THRESHOLD = 140;

export function ActiveQueryHeader({ query }: ActiveQueryHeaderProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const isLong = query.length > TRUNCATE_THRESHOLD;

  return (
    <div className="mb-4 rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        Active Query
      </p>
      <p className={`text-sm text-slate-300 ${isExpanded || !isLong ? "" : "line-clamp-2"}`}>
        {query}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-1 text-xs font-medium text-clinical-cyan hover:underline"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
