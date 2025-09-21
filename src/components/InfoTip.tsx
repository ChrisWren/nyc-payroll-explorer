"use client";

import { useState } from 'react';
import { Modal } from 'react-bootstrap';

const modalBody = `This explorer pulls the top 5,000 NYC payroll records for fiscal year 2024
directly from the NYC Open Data portal. Records are sorted by their highest
regular gross pay and grouped by job title. Use the agency filter to narrow the
results to a specific department.`;

export default function InfoTip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="info-modal"
        aria-label="How this data is generated"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-base font-semibold text-black shadow-[3px_3px_0_0_#000] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000] focus:translate-y-0 focus:shadow-[3px_3px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black/30"
        onClick={() => setIsOpen(true)}
      >
        i
      </button>
      <Modal
        show={isOpen}
        onHide={() => setIsOpen(false)}
        centered
        size="lg"
        aria-labelledby="info-modal-title"
        contentClassName="border-2 border-black rounded-lg shadow-[6px_6px_0_0_#000]"
        backdropClassName="bg-black/50"
      >
        <Modal.Header closeButton closeVariant="white" className="bg-dark text-warning border-0">
          <Modal.Title id="info-modal-title" className="text-uppercase tracking-wide">
            About The Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="info-modal" className="bg-white text-gray-900 text-sm leading-6">
          {modalBody}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-0">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="relative inline-flex items-center justify-center rounded-md border-2 border-black bg-gradient-to-r from-amber-300 via-pink-400 to-lime-300 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-black shadow-[4px_4px_0_0_#000] transition-transform duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] focus:translate-y-0 focus:shadow-[4px_4px_0_0_#000] focus:outline-none focus:ring-4 focus:ring-black/40"
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
