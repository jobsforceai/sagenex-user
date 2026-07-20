"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Home,
  Info,
  Landmark,
  LoaderCircle,
  Search,
  ShieldCheck,
} from "lucide-react";

type KycDocumentField = {
  field_id: string;
  section: string;
  field_label: string;
  requiredness: string;
  description: string;
  allowed_values_or_format: string;
};

const CSV_URL = "/data/kyc-details.csv";
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const parseCsv = (source: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
};

const toKycDocuments = (source: string): KycDocumentField[] => {
  const [headers = [], ...rows] = parseCsv(source);
  const indexOf = (header: keyof KycDocumentField) => {
    const index = headers.indexOf(header);
    if (index < 0) throw new Error(`Missing KYC column: ${header}`);
    return index;
  };

  const indexes = {
    field_id: indexOf("field_id"),
    section: indexOf("section"),
    field_label: indexOf("field_label"),
    requiredness: indexOf("requiredness"),
    description: indexOf("description"),
    allowed_values_or_format: indexOf("allowed_values_or_format"),
  };

  return rows
    .filter((row) => row[indexes.field_id]?.trim())
    .map((row) => ({
      field_id: row[indexes.field_id]?.trim() || "—",
      section: row[indexes.section]?.trim() || "—",
      field_label: row[indexes.field_label]?.trim() || "—",
      requiredness: row[indexes.requiredness]?.trim() || "—",
      description: row[indexes.description]?.trim() || "—",
      allowed_values_or_format: row[indexes.allowed_values_or_format]?.trim() || "—",
    }));
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  return [...new Set([
    1,
    Math.max(2, currentPage - 1),
    currentPage,
    Math.min(totalPages - 1, currentPage + 1),
    totalPages,
  ])].sort((a, b) => a - b);
};

const RequirementBadge = ({ value }: { value: string }) => {
  const normalizedValue = value.toLowerCase();
  const className = normalizedValue === "required"
    ? "border-[#D7B8C3] bg-[#FFF0F3] text-[#8E1537]"
    : normalizedValue === "conditional"
      ? "border-[#E7CF8D] bg-[#FFF7DC] text-[#765313]"
      : "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] ${className}`}>
      {value}
    </span>
  );
};

const MobileDocumentCard = ({ field, serialNumber }: { field: KycDocumentField; serialNumber: number }) => (
  <article className="border border-[#D8D1C5] bg-white shadow-[0_3px_12px_rgba(36,34,31,0.06)]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D8D1C5] bg-[#F8F4EE] px-4 py-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B655D]">Reference {String(serialNumber).padStart(3, "0")}</p>
        <p className="mt-1 text-lg font-bold tracking-tight text-[#8E1537]">{field.field_id}</p>
      </div>
      <RequirementBadge value={field.requiredness} />
    </div>

    <dl className="grid gap-0">
      {[
        ["Section", field.section],
        ["Field label", field.field_label],
        ["Description", field.description],
        ["Allowed values / format", field.allowed_values_or_format],
      ].map(([label, value]) => (
        <div key={label} className="border-b border-[#E2E8F0] px-4 py-3 last:border-b-0">
          <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B655D]">{label}</dt>
          <dd className="mt-1 break-words text-sm font-medium leading-6 text-[#24221F]">{value}</dd>
        </div>
      ))}
    </dl>
  </article>
);

export default function NewKycDocsPage() {
  const [documents, setDocuments] = useState<KycDocumentField[]>([]);
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDocuments = async () => {
      try {
        const response = await fetch(CSV_URL, { signal: controller.signal });
        if (!response.ok) throw new Error("The KYC document reference could not be loaded.");
        setDocuments(toKycDocuments(await response.text()));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "The KYC document reference could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadDocuments();
    return () => controller.abort();
  }, []);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return documents;

    return documents.filter((document) =>
      Object.values(document).some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [documents, query]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + pageSize);
  const visiblePages = getVisiblePages(safeCurrentPage, totalPages);
  const resultStart = filteredDocuments.length === 0 ? 0 : startIndex + 1;
  const resultEnd = Math.min(startIndex + pageSize, filteredDocuments.length);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F4EE] text-[#24221F]">
      <a
        href="#main-content"
        className="sr-only z-[100] bg-white px-4 py-3 font-bold text-[#8E1537] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <header>
        <div className="bg-[#173C2C] text-white">
          <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-8">
            <p className="font-semibold tracking-wide">SAGENEX <span className="mx-2 text-white/40">|</span> Compliance Services</p>
            <div className="hidden items-center gap-4 sm:flex">
              <a href="#main-content" className="border-b border-transparent transition hover:border-white focus:outline-none focus:ring-2 focus:ring-white/60">
                Skip to main content
              </a>
            </div>
          </div>
        </div>

        <div className="border-b border-[#D8D1C5] bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-28 shrink-0 items-center justify-center border-r border-[#D8D1C5] pr-4">
                <Image
                  src="/logo5.png"
                  alt="Sagenex bull and bear logo"
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-full object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#625E58]">Sagenex Compliance Division</p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-[#173C2C] sm:text-3xl">New KYC Documents</h1>
                <p className="mt-1 text-sm font-medium text-[#49443E]">Information, field definitions and submission guidelines</p>
              </div>
            </div>

            <div className="flex max-w-sm items-center gap-3 border border-[#CFC7BA] bg-[#FAF7F2] px-4 py-3">
              <ShieldCheck aria-hidden="true" className="h-8 w-8 shrink-0 text-[#0F6B48]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#0F6B48]">Controlled reference</p>
                <p className="mt-0.5 text-sm font-semibold text-[#213A52]">Sagenex KYC specification</p>
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Documentation navigation" className="bg-[#8E1537] text-white">
          <div className="mx-auto flex max-w-[1440px] overflow-x-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex min-h-12 shrink-0 items-center gap-2 border-x border-white/10 px-4 text-sm font-semibold transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/kyc"
              className="inline-flex min-h-12 shrink-0 items-center border-r border-white/10 px-4 text-sm font-semibold transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              KYC verification
            </Link>
            <a
              href="#document-directory"
              aria-current="page"
              className="inline-flex min-h-12 shrink-0 items-center border-b-4 border-[#F2C14E] bg-white/10 px-4 pt-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              Document field directory
            </a>
          </div>
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        <section aria-labelledby="notice-title" className="border border-[#E6D8AD] bg-[#FFF9E9] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4E5B8] text-[#5D4A18]">
                <Bell aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 id="notice-title" className="text-base font-bold uppercase tracking-[0.04em] text-[#2C3D4F]">Notice</h2>
                <p className="mt-1 text-sm leading-6 text-[#46413B]">
                  This directory contains the controlled KYC field definitions used for Sagenex account onboarding and review.
                  Search the register below before preparing or validating a submission.
                </p>
              </div>
            </div>
            <div className="shrink-0 border-l-4 border-[#D4B45A] pl-3 text-sm">
              <p className="font-bold text-[#243B52]">Live reference</p>
              <p className="mt-0.5 text-[#686158]">{documents.length || "—"} registered fields</p>
            </div>
          </div>
        </section>

        <section id="document-directory" aria-labelledby="kyc-docs-table-title" className="mt-5 border border-[#D8D1C5] bg-white shadow-[0_8px_24px_rgba(36,34,31,0.08)]">
          <div className="border-b border-[#D8D1C5] bg-[#FAF7F2] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[#8E1537]">
                  <Landmark aria-hidden="true" className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-[0.12em]">Official field register</p>
                </div>
                <h2 id="kyc-docs-table-title" className="mt-2 text-xl font-bold text-[#24221F]">KYC document field directory</h2>
                <p className="mt-1 text-sm text-[#686158]" aria-live="polite">
                  Showing {resultStart}–{resultEnd} of {filteredDocuments.length} matching fields
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 sm:w-80">
                  <label htmlFor="kyc-docs-search" className="block text-xs font-bold uppercase tracking-[0.08em] text-[#4F4942]">
                    Search the register
                  </label>
                  <div className="relative mt-2">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#625E58]" />
                    <input
                      id="kyc-docs-search"
                      type="search"
                      value={query}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder="Field ID, label, section or keyword"
                      className="h-11 w-full border border-[#B8ADA0] bg-white pl-10 pr-3 text-base font-medium text-[#24221F] outline-none transition placeholder:text-[#7A7167] focus:border-[#8E1537] focus:ring-2 focus:ring-[#8E1537]/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="kyc-page-size" className="block text-xs font-bold uppercase tracking-[0.08em] text-[#4F4942]">
                    Records per page
                  </label>
                  <select
                    id="kyc-page-size"
                    value={pageSize}
                    onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                    className="mt-2 h-11 w-full min-w-32 cursor-pointer border border-[#B8ADA0] bg-white px-3 text-sm font-bold text-[#24221F] outline-none focus:border-[#8E1537] focus:ring-2 focus:ring-[#8E1537]/20 sm:w-auto"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center" aria-live="polite">
              <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin text-[#8E1537] motion-reduce:animate-none" />
              <p className="mt-3 text-sm font-bold text-[#24221F]">Loading the official field register…</p>
            </div>
          )}

          {!loading && error && (
            <div className="m-4 flex min-h-64 flex-col items-center justify-center border border-[#D9B2B2] bg-[#FFF5F5] p-8 text-center" role="alert">
              <AlertCircle aria-hidden="true" className="h-7 w-7 text-[#A82424]" />
              <p className="mt-3 font-bold text-[#7B1F1F]">Document reference unavailable</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-[#5B4B4B]">{error} Refresh the page to try again.</p>
            </div>
          )}

          {!loading && !error && paginatedDocuments.length > 0 && (
            <>
              <div className="grid gap-3 bg-[#EFEAE2] p-3 md:hidden">
                {paginatedDocuments.map((field, index) => (
                  <MobileDocumentCard key={field.field_id} field={field} serialNumber={startIndex + index + 1} />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[1260px] border-collapse text-left">
                  <caption className="sr-only">Searchable Sagenex KYC document field reference</caption>
                  <thead>
                    <tr className="bg-[#8E1537] text-white">
                      {[
                        "Sr. No.",
                        "Field ID",
                        "Section",
                        "Field label",
                        "Requiredness",
                        "Description",
                        "Allowed values / format",
                      ].map((heading) => (
                        <th key={heading} scope="col" className="border-r border-white/15 px-4 py-3 text-xs font-bold last:border-r-0">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocuments.map((field, index) => (
                      <tr key={field.field_id} className="border-b border-[#DED7CC] align-top odd:bg-white even:bg-[#FCFAF7] hover:bg-[#FFF4F6]">
                        <td className="w-20 px-4 py-4 text-center text-sm font-semibold text-[#405A72]">{startIndex + index + 1}</td>
                        <th scope="row" className="whitespace-nowrap px-4 py-4 text-sm font-bold text-[#8E1537]">{field.field_id}</th>
                        <td className="max-w-56 px-4 py-4 text-sm font-medium leading-5 text-[#2E2A26]">{field.section}</td>
                        <td className="max-w-48 px-4 py-4 text-sm font-semibold leading-5 text-[#2E2A26]">{field.field_label}</td>
                        <td className="px-4 py-4"><RequirementBadge value={field.requiredness} /></td>
                        <td className="max-w-80 px-4 py-4 text-sm font-normal leading-6 text-[#554F48]">{field.description}</td>
                        <td className="max-w-80 px-4 py-4 text-sm font-normal leading-6 text-[#554F48]">{field.allowed_values_or_format}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && !error && paginatedDocuments.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <Search aria-hidden="true" className="h-7 w-7 text-[#625E58]" />
              <p className="mt-3 font-bold text-[#24221F]">No matching document fields</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-[#686158]">
                Try a field ID such as KY-001, a section name, or a shorter keyword.
              </p>
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="mt-4 min-h-11 cursor-pointer border border-[#8E1537] bg-white px-4 text-sm font-bold text-[#8E1537] transition hover:bg-[#FFF0F3] focus:outline-none focus:ring-2 focus:ring-[#8E1537]/30"
              >
                Clear search
              </button>
            </div>
          )}

          {!loading && !error && filteredDocuments.length > 0 && (
            <nav
              aria-label="KYC document pagination"
              className="flex flex-col gap-4 border-t border-[#D8D1C5] bg-[#FAF7F2] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <p className="text-sm font-medium text-[#625C55]">
                Page <span className="font-bold text-[#24221F]">{safeCurrentPage}</span> of{" "}
                <span className="font-bold text-[#24221F]">{totalPages}</span>
              </p>

              <div className="flex max-w-full flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-1 border border-[#B8ADA0] bg-white px-3 text-sm font-bold text-[#24221F] transition hover:bg-[#FFF0F3] focus:outline-none focus:ring-2 focus:ring-[#8E1537]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                  Previous
                </button>

                <div className="hidden items-center gap-1.5 sm:flex">
                  {visiblePages.map((page, index) => {
                    const previousPage = visiblePages[index - 1];
                    return (
                      <div key={page} className="flex items-center gap-1.5">
                        {previousPage && page - previousPage > 1 && <span className="px-1 text-[#686158]">…</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          aria-current={page === safeCurrentPage ? "page" : undefined}
                          aria-label={`Go to page ${page}`}
                          className={`h-11 min-w-11 cursor-pointer border px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#8E1537]/30 ${
                            page === safeCurrentPage
                              ? "border-[#8E1537] bg-[#8E1537] text-white"
                              : "border-[#B8ADA0] bg-white text-[#24221F] hover:bg-[#FFF0F3]"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-1 border border-[#B8ADA0] bg-white px-3 text-sm font-bold text-[#24221F] transition hover:bg-[#FFF0F3] focus:outline-none focus:ring-2 focus:ring-[#8E1537]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </nav>
          )}

          <div className="m-4 flex items-start gap-3 border border-[#D9CDC6] bg-[#FFF6F0] px-4 py-3 text-sm text-[#51453B] sm:m-5">
            <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#8E1537]" />
            <div>
              <p className="font-bold">Reference note</p>
              <p className="mt-0.5 leading-6">Use the exact field definition and permitted format shown in this register when preparing KYC records.</p>
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#D8D1C5] pt-4 text-xs text-[#6B655D]">
          <p>Document control: Sagenex KYC field register</p>
          <div className="hidden items-center gap-2 sm:flex">
            <FileSearch aria-hidden="true" className="h-4 w-4" />
            <span>{documents.length || "—"} records indexed</span>
          </div>
        </div>
      </main>

      <footer className="mt-8 bg-[#173C2C] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold">Sagenex Compliance Documentation</p>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-white/70">
              This portal is an official Sagenex product reference. It is not a government website or a substitute for legal or regulatory advice.
            </p>
          </div>
          <nav aria-label="Footer links" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
            <Link href="/privacy" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white/70">Privacy</Link>
            <Link href="/terms" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white/70">Terms of use</Link>
          </nav>
        </div>
        <div className="border-t border-white/15 px-4 py-3 text-center text-xs text-white/65">
          © {new Date().getFullYear()} Sagenex. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
