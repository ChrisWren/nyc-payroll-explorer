"use client";

import { useId, useState } from 'react';

const tooltipBody =
  'This explorer pulls the top 5,000 NYC payroll records for fiscal year 2024 directly from the NYC Open Data portal. Filter by agency to narrow the results.';

export default function InfoTip() {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        aria-describedby={isVisible ? tooltipId : undefined}
        aria-label="How this data is generated"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-base font-semibold text-black shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000] focus:translate-y-0 focus:shadow-[3px_3px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black/30"
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        i
      </button>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-3 w-72 max-w-xs -translate-x-1/2 rounded-lg border-2 border-black bg-white p-4 text-left text-xs font-normal leading-snug text-gray-900 shadow-[4px_4px_0_0_#000]"
        >
          {tooltipBody}
        </div>
      )}
    </div>
  );
}
