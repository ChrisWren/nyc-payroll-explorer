"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Loading from '@/components/Loading';
import JobDetailsModal from '@/components/JobDetailsModal';
import { formatSalaryRange } from '@/lib/formatSalary';

const PAYROLL_API_BASE =
  process.env.NEXT_PUBLIC_PAYROLL_API_BASE ?? 'https://data.cityofnewyork.us/resource/k397-673e.json';
const JOB_SUMMARY_ENDPOINT = process.env.NEXT_PUBLIC_JOB_SUMMARY_ENDPOINT ?? '';

const retroButtonBase =
  'relative inline-flex items-center rounded-md border-2 border-black bg-gradient-to-r from-amber-300 via-pink-400 to-lime-300 text-black font-extrabold uppercase tracking-wide shadow-[4px_4px_0_0_#000] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black/40 active:translate-y-0 active:shadow-[2px_2px_0_0_#000]';
const retroButton = `${retroButtonBase} justify-center px-4 py-2 text-sm`;
const retroButtonSmall = `${retroButtonBase} justify-center px-3 py-1 text-xs`;
const retroButtonGrid = `${retroButtonBase} min-h-[3rem] justify-start px-5 py-3 text-xs`;

const agencyEmojiRules: Array<{ test: RegExp; emoji: string }> = [
  { test: /POLICE|LAW ENFORCEMENT|SPECIAL NARC/i, emoji: '🚓' },
  { test: /FIRE|SANITATION|EMERGENCY/i, emoji: '🚒' },
  { test: /EDUCATION|SCHOOL|COLLEGE|UNIVERSITY|PEDAGOGICAL/i, emoji: '🎓' },
  { test: /TRANSPORT|TRANSPORTATION|TAXI|LIMOUSINE/i, emoji: '🚇' },
  { test: /PARKS|RECREATION|ENVIRONMENT|WATER|SANITATION/i, emoji: '🌳' },
  { test: /HEALTH|HOSPITAL|HYGIENE|MENTAL/i, emoji: '🏥' },
  { test: /HOUSING|HOMELESS|SHELTER/i, emoji: '🏠' },
  { test: /FINANCE|BUDGET|TREASURY|TAX|REVENUE/i, emoji: '💰' },
  { test: /CULTURAL|MUSEUM|ARTS|CULTURE/i, emoji: '🎭' },
  { test: /TECH|TECHNOLOGY|INNOVATION|INFORMATION|CYBER/i, emoji: '💾' },
  { test: /JUSTICE|COURT|TRIAL|PROBATION|CORRECTION|LEGAL|ATTORNEY|COMMISSION/i, emoji: '⚖️' },
  { test: /VETERAN|MILITARY/i, emoji: '🎖️' },
  { test: /MAYOR|COUNCIL|COMPTROLLER|OMB/i, emoji: '🏛️' },
];

// Define a type for the payroll data
type PayrollData = {
  agency_name: string;
  title_description: string;
  payMin: number;
  payMax: number;
  count: number;
};

type PayrollApiRow = {
  fiscal_year: string;
  agency_name: string;
  title_description: string;
  regular_gross_paid: string;
};

type JobDetailsModalState =
  | { isOpen: false }
  | {
      isOpen: true;
      title: string;
      agency: string;
      payMin: number;
      payMax: number;
      count: number;
      summary: string | null;
      loading: boolean;
      error: string | null;
    };

export default function Home() {
  const [data, setData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDetailsModal, setJobDetailsModal] = useState<JobDetailsModalState>({ isOpen: false });
  const jobDetailsRequestId = useRef(0);
  const [isAgencyMenuOpen, setIsAgencyMenuOpen] = useState(false);
  const agencyMenuRef = useRef<HTMLDivElement | null>(null);
  const [agencyFilter, setAgencyFilter] = useState('');
  const [agencies, setAgencies] = useState<string[]>([]);
  const [agencySearch, setAgencySearch] = useState('');
  const agencySearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          $select: 'fiscal_year,agency_name,title_description,regular_gross_paid',
          $order: 'regular_gross_paid DESC',
          $limit: '5000',
          $offset: '0',
        });

        const whereClauses = ["fiscal_year='2024'"];
        if (agencyFilter) {
          const escapedAgency = agencyFilter.replace(/'/g, "''");
          whereClauses.push(`agency_name='${escapedAgency}'`);
        }
        params.set('$where', whereClauses.join(' AND '));

        const response = await fetch(`${PAYROLL_API_BASE}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const rawResult: unknown = await response.json();
        if (!Array.isArray(rawResult)) {
          throw new Error('Unexpected payroll response format');
        }
        const result: PayrollApiRow[] = rawResult;
        const grouped = new Map<string, PayrollData>();

        result.forEach((item) => {
          const pay = Number.parseFloat(item.regular_gross_paid);
          if (!Number.isFinite(pay)) {
            return;
          }

          const key = `${item.agency_name}__${item.title_description}`;
          const existing = grouped.get(key);
          if (existing) {
            existing.count += 1;
            if (pay > existing.payMax) {
              existing.payMax = pay;
            }
            if (pay > 0 && pay < existing.payMin) {
              existing.payMin = pay;
            }
          } else {
            grouped.set(key, {
              agency_name: item.agency_name,
              title_description: item.title_description,
              payMin: pay > 0 ? pay : Number.POSITIVE_INFINITY,
              payMax: pay,
              count: 1,
            });
          }
        });

        const groupedData = Array.from(grouped.values())
          .map((entry) => ({
            ...entry,
            payMin: Number.isFinite(entry.payMin) ? entry.payMin : Math.max(entry.payMax, 0),
          }))
          .sort((a, b) => b.payMax - a.payMax);
        setData(groupedData);
        if (!agencyFilter) {
          const uniqueAgencies = Array.from(new Set(result.map((item) => item.agency_name))).sort((a, b) =>
            a.localeCompare(b),
          );
          setAgencies(uniqueAgencies);
        }
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agencyFilter]);

  useEffect(() => {
    if (!isAgencyMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (agencyMenuRef.current && !agencyMenuRef.current.contains(event.target as Node)) {
        setIsAgencyMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAgencyMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAgencyMenuOpen]);

  useEffect(() => {
    if (!isAgencyMenuOpen) {
      return;
    }
    const input = agencySearchInputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, [isAgencyMenuOpen]);

  const handleViewDetails = (title: string, agency: string, payMin: number, payMax: number, count: number) => {
    const requestId = jobDetailsRequestId.current + 1;
    jobDetailsRequestId.current = requestId;
    console.log('Viewing job details', { title, agency, payMin, payMax, count });
    setJobDetailsModal({
      isOpen: true,
      title,
      agency,
      payMin,
      payMax,
      count,
      summary: null,
      loading: true,
      error: null,
    });

    if (!JOB_SUMMARY_ENDPOINT) {
      setJobDetailsModal({
        isOpen: true,
        title,
        agency,
        payMin,
        payMax,
        count,
        summary: null,
        loading: false,
        error: null,
      });
      return;
    }

    const fetchDetails = async () => {
      try {
        const summaryUrl = new URL(JOB_SUMMARY_ENDPOINT, window.location.origin);
        summaryUrl.searchParams.set('title', title);
        if (agency) {
          summaryUrl.searchParams.set('agency', agency);
        }

        const response = await fetch(summaryUrl.toString());
        if (!response.ok) {
          let message = 'Failed to fetch job details';
          try {
            const errorBody = await response.json();
            if (errorBody?.error) {
              message = errorBody.error;
            }
          } catch {
            // Non-JSON error bodies can be ignored
          }
          throw new Error(message);
        }

        const result: unknown = await response.json();
        let summary: string | null = null;
        if (
          typeof result === 'object' &&
          result !== null &&
          'summary' in result &&
          typeof (result as { summary?: unknown }).summary === 'string'
        ) {
          summary = (result as { summary: string }).summary;
        }

        if (jobDetailsRequestId.current === requestId) {
          setJobDetailsModal({
            isOpen: true,
            title,
            agency,
            payMin,
            payMax,
            count,
            summary,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        if (jobDetailsRequestId.current === requestId) {
          setJobDetailsModal({
            isOpen: true,
            title,
            agency,
            payMin,
            payMax,
            count,
            summary: null,
            loading: false,
            error: message,
          });
        }
      }
    };

    void fetchDetails();
  };

  const handleCloseModal = () => {
    jobDetailsRequestId.current += 1;
    setJobDetailsModal({ isOpen: false });
  };

  const handleSelectAgency = (value: string) => {
    setAgencyFilter(value);
    setIsAgencyMenuOpen(false);
    setAgencySearch('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getAgencyEmoji = (value: string) => {
    if (!value) {
      return '🗽';
    }
    const upper = value.toUpperCase();
    const match = agencyEmojiRules.find(({ test }) => test.test(upper));
    return match ? match.emoji : '🏢';
  };

  const agencyOptions = useMemo(
    () => [
      { label: 'All Agencies', value: '' },
      ...agencies.map((agency) => ({ label: agency, value: agency })),
    ],
    [agencies],
  );

  const filteredAgencyOptions = useMemo(() => {
    const query = agencySearch.trim().toLowerCase();
    if (!query) {
      return agencyOptions;
    }
    return agencyOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [agencyOptions, agencySearch]);

  const selectedAgencyOption = useMemo(
    () => agencyOptions.find((option) => option.value === agencyFilter) ?? agencyOptions[0],
    [agencyOptions, agencyFilter],
  );

  const selectedAgencyEmoji = getAgencyEmoji(selectedAgencyOption.value);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between px-6 pb-16 pt-24 sm:px-10 sm:pb-20 sm:pt-28 lg:px-24 lg:pb-24 lg:pt-32">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="mb-8 text-center text-3xl font-bold sm:text-4xl lg:text-5xl">NYC Payroll Explorer</h1>
      </div>

      <div className="mb-6 w-full max-w-5xl self-start">
        <div ref={agencyMenuRef} className="relative inline-block w-full text-left sm:w-auto">
          <button
            type="button"
            onClick={() => setIsAgencyMenuOpen((previous) => !previous)}
            className={`${retroButton} w-full justify-between gap-3 sm:w-64`}
            aria-haspopup="menu"
            aria-expanded={isAgencyMenuOpen}
          >
            <span className="flex items-center gap-2 truncate">
              <span aria-hidden>{selectedAgencyEmoji}</span>
              <span className="truncate">{selectedAgencyOption.label}</span>
            </span>
            {isAgencyMenuOpen && (
              <span className="ml-2 text-sm" aria-hidden>
                ^
              </span>
            )}
          </button>
          {isAgencyMenuOpen && (
            <div className="absolute z-40 mt-2 w-[90vw] max-w-[48rem] origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 sm:w-[36rem] lg:w-[48rem]">
              <div className="border-b border-black/10 p-4">
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500" htmlFor="agency-filter-search">
                  Search agencies
                </label>
                <input
                  id="agency-filter-search"
                  ref={agencySearchInputRef}
                  type="text"
                  value={agencySearch}
                  onChange={(event) => setAgencySearch(event.target.value)}
                  className="w-full rounded-md border border-black/20 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/30"
                  placeholder="Start typing an agency name"
                />
              </div>
              <ul
                className="grid max-h-72 grid-cols-1 gap-3 overflow-auto p-4 list-none sm:grid-cols-2 lg:gap-4"
                role="menu"
                aria-label="Agency filter options"
              >
                {filteredAgencyOptions.length === 0 && (
                  <li className="col-span-2 text-sm text-gray-500" role="presentation">
                    No agencies found.
                  </li>
                )}
                {filteredAgencyOptions.map((option) => {
                  const emoji = getAgencyEmoji(option.value);
                  const isSelected = option.value === agencyFilter;
                  return (
                    <li key={option.label} role="none">
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectAgency(option.value)}
                        className={`${retroButtonGrid} w-full gap-3 text-left normal-case ${
                          isSelected ? 'shadow-[6px_6px_0_0_#000]' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <span aria-hidden>{emoji}</span>
                        <span className="whitespace-normal break-words">{option.label}</span>
                        {isSelected && (
                          <span className="ml-auto text-xs text-black" aria-hidden>
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full max-w-5xl self-start">
        {loading && <Loading />}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-600 sm:px-4 sm:text-sm">Agency</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-600 sm:px-4 sm:text-sm">Title</th>
                  <th className="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-600 sm:px-4 sm:text-sm">
                    <span className="mr-2">Salary Range</span>
                    <span className="text-[0.65rem] text-gray-500 sm:text-xs" aria-label="sorted high to low">
                      (high → low)
                    </span>
                  </th>
                  <th className="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-600 sm:px-4 sm:text-sm">Employees</th>
                  <th className="border-b px-3 py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => {
                  const emoji = getAgencyEmoji(row.agency_name);
                  return (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border-b px-3 py-3 sm:px-4">
                        <button
                          type="button"
                          onClick={() => handleSelectAgency(row.agency_name)}
                          className="flex items-center gap-2 border-0 bg-transparent p-0 text-left text-blue-700 hover:underline focus:outline-none focus-visible:underline"
                          title={`Show only ${row.agency_name}`}
                        >
                          <span aria-hidden="true">{emoji}</span>
                          <span className="align-middle text-sm sm:text-base">{row.agency_name}</span>
                        </button>
                      </td>
                      <td className="border-b px-3 py-3 text-sm sm:px-4 sm:text-base">{row.title_description}</td>
                      <td className="border-b px-3 py-3 text-sm sm:px-4 sm:text-base">{formatSalaryRange(row.payMin, row.payMax)}</td>
                      <td className="border-b px-3 py-3 text-sm sm:px-4 sm:text-base">{row.count}</td>
                      <td className="border-b px-3 py-3 sm:px-4">
                        <button
                          onClick={() =>
                            handleViewDetails(row.title_description, row.agency_name, row.payMin, row.payMax, row.count)
                          }
                          className={`${retroButtonSmall} whitespace-nowrap text-xs sm:text-sm`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {jobDetailsModal.isOpen && (
          <JobDetailsModal
            title={jobDetailsModal.title}
            agency={jobDetailsModal.agency}
            payMin={jobDetailsModal.payMin}
            payMax={jobDetailsModal.payMax}
            count={jobDetailsModal.count}
            summary={jobDetailsModal.summary}
            loading={jobDetailsModal.loading}
            error={jobDetailsModal.error}
            onClose={handleCloseModal}
          />
      )}
    </main>
  );
}
