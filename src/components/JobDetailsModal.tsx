
"use client";

import { Modal } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { formatSalaryRange } from '@/lib/formatSalary';

const retroButtonBase =
  'relative inline-flex items-center justify-center rounded-md border-2 border-black bg-gradient-to-r from-amber-300 via-pink-400 to-lime-300 text-black font-extrabold uppercase tracking-wide shadow-[4px_4px_0_0_#000] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black/40 active:translate-y-0 active:shadow-[2px_2px_0_0_#000]';
const retroButton = `${retroButtonBase} px-4 py-2 text-sm`;

type JobDetailsModalProps = {
  title: string;
  agency: string;
  payMin: number;
  payMax: number;
  count: number;
  summary: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

export default function JobDetailsModal({
  title,
  agency,
  payMin,
  payMax,
  count,
  summary,
  loading,
  error,
  onClose,
}: JobDetailsModalProps) {
  return (
    <Modal show onHide={onClose} centered size="lg" backdrop="static" scrollable>
      <Modal.Header closeButton className="bg-dark text-warning border-0">
        <Modal.Title className="text-uppercase tracking-wide">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-white text-gray-900">
        <p className="text-sm text-gray-600 mb-4">{agency || 'Agency unavailable'}</p>
        <div className="d-flex flex-wrap gap-3 mb-4">
          <span className="badge bg-warning text-dark fs-6" aria-label={`Employee count ${count}`}>
            👥 {count} {count === 1 ? 'Employee' : 'Employees'}
          </span>
          <span className="badge bg-success text-dark fs-6" aria-label="Pay range">
            💵 {formatSalaryRange(payMin, payMax)}
          </span>
        </div>
        {loading && <p className="mb-0">Loading...</p>}
        {error && <p className="text-danger fw-semibold">Error: {error}</p>}
        {!loading && !error && (
          <div>
            {summary !== null ? (
              <div className="markdown-content">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            ) : (
              <p>Summary unavailable.</p>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark border-0">
        <button onClick={onClose} className={retroButton}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}
