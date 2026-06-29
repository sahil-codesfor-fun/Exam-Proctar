import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, Filter, SortAsc, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import StudentAccordionTable from './StudentAccordionTable';
import { exportResultsAsCSV, exportResultsAsExcel } from './ExportUtils';
import { downloadAllReportsPDF } from './ReportPdfGenerator';

const PAGE_SIZES = [10, 25, 50, 100];

const HistoricalSubmissions = ({ exam }) => {
  const examId = exam._id || exam.id;
  const examTitle = exam.title || 'Exam';

  // ─── State ─────────────────────────────────────────────────
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [percentageFilter, setPercentageFilter] = useState('');
  const [infractionFilter, setInfractionFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState('highest');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk export
  const [bulkExporting, setBulkExporting] = useState(false);

  // ─── Fetch Results ─────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/trainer/results/${examId}`);
      setResults(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError('Failed to load results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // ─── Filtering & Sorting ──────────────────────────────────
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.studentName?.toLowerCase().includes(q) ||
        r.studentRollNo?.toLowerCase().includes(q) ||
        r.studentEmail?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Percentage filter
    if (percentageFilter) {
      if (percentageFilter === 'above75') filtered = filtered.filter(r => r.percentage >= 75);
      else if (percentageFilter === 'above50') filtered = filtered.filter(r => r.percentage >= 50 && r.percentage < 75);
      else if (percentageFilter === 'above33') filtered = filtered.filter(r => r.percentage >= 33.33 && r.percentage < 50);
      else if (percentageFilter === 'below33') filtered = filtered.filter(r => r.percentage < 33.33);
    }

    // Infraction filter
    if (infractionFilter) {
      if (infractionFilter === 'none') filtered = filtered.filter(r => r.violationCount === 0);
      else if (infractionFilter === 'has') filtered = filtered.filter(r => r.violationCount > 0);
      else if (infractionFilter === 'high') filtered = filtered.filter(r => r.violationCount >= 3);
    }

    // Sort
    if (sortBy === 'highest') filtered.sort((a, b) => b.totalScore - a.totalScore);
    else if (sortBy === 'lowest') filtered.sort((a, b) => a.totalScore - b.totalScore);
    else if (sortBy === 'percentage') filtered.sort((a, b) => b.percentage - a.percentage);
    else if (sortBy === 'name') filtered.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    else if (sortBy === 'time') filtered.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

    return filtered;
  }, [results, searchQuery, statusFilter, percentageFilter, infractionFilter, sortBy]);

  // ─── Pagination ────────────────────────────────────────────
  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, percentageFilter, infractionFilter, sortBy, pageSize]);

  // ─── Bulk Export ───────────────────────────────────────────
  const handleBulkPDF = async () => {
    setBulkExporting(true);
    try {
      // Fetch all detailed reports
      const reports = [];
      for (const r of filteredResults) {
        try {
          const res = await api.get(`/trainer/results/${examId}/${r.submissionId}`);
          reports.push(res.data.data);
        } catch (err) {
          console.error(`Failed to fetch report for ${r.submissionId}:`, err);
        }
      }
      if (reports.length > 0) {
        await downloadAllReportsPDF(reports, examTitle);
      }
    } catch (err) {
      console.error('Bulk PDF export failed:', err);
    } finally {
      setBulkExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPercentageFilter('');
    setInfractionFilter('');
    setSortBy('highest');
  };

  const hasActiveFilters = searchQuery || statusFilter || percentageFilter || infractionFilter;

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-2 h-6 bg-[#4B775E] rounded-full"></div>
            Historical Submissions
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-black">{filteredResults.length}</span>
          </h3>

          {/* Bulk Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkPDF}
              disabled={bulkExporting || filteredResults.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-black hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {bulkExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              {bulkExporting ? 'Generating...' : 'All Reports (ZIP)'}
            </button>
            <button
              onClick={() => exportResultsAsCSV(filteredResults, examTitle)}
              disabled={filteredResults.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-40"
            >
              <FileText size={12} /> CSV
            </button>
            <button
              onClick={() => exportResultsAsExcel(filteredResults, examTitle)}
              disabled={filteredResults.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-40"
            >
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll number, or email…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium outline-none border border-gray-200 focus:border-[#4B775E] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showFilters || hasActiveFilters ? 'bg-[#4B775E] text-white border-[#4B775E]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
          >
            <Filter size={12} /> Filters {hasActiveFilters && <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-md text-[8px]">ON</span>}
          </button>

          {/* Sort */}
          <div className="relative">
            <SortAsc size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-9 pr-6 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 outline-none cursor-pointer appearance-none text-gray-600 hover:border-gray-400 transition-all"
            >
              <option value="highest">Highest Marks</option>
              <option value="lowest">Lowest Marks</option>
              <option value="percentage">Percentage</option>
              <option value="name">Name (A-Z)</option>
              <option value="time">Submission Time</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex-wrap animate-in slide-in-from-top-2 fade-in duration-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer text-gray-600"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="auto_submitted">Auto Submitted</option>
              <option value="force_submitted">Force Submitted</option>
              <option value="in_progress">In Progress</option>
            </select>

            <select
              value={percentageFilter}
              onChange={(e) => setPercentageFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer text-gray-600"
            >
              <option value="">All Percentages</option>
              <option value="above75">≥ 75%</option>
              <option value="above50">50% – 74%</option>
              <option value="above33">33% – 49%</option>
              <option value="below33">&lt; 33%</option>
            </select>

            <select
              value={infractionFilter}
              onChange={(e) => setInfractionFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer text-gray-600"
            >
              <option value="">All Infractions</option>
              <option value="none">No Infractions</option>
              <option value="has">Has Infractions</option>
              <option value="high">High (≥ 3)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={12} /> Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="px-6 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-50">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#4B775E] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Results…</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-4xl opacity-20 mb-3">⚠️</div>
            <p className="text-xs font-bold text-red-400">{error}</p>
            <button onClick={fetchResults} className="mt-3 text-[10px] font-black text-[#4B775E] uppercase tracking-widest hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <StudentAccordionTable
            results={paginatedResults}
            examId={examId}
            examTitle={examTitle}
          />
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredResults.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 bg-gray-50/30">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-white rounded-lg border border-gray-200 outline-none cursor-pointer font-black text-gray-600 text-[10px]"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>per page</span>
            <span className="mx-2 text-gray-300">|</span>
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredResults.length)} of {filteredResults.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} className="text-gray-500" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === pageNum ? 'bg-[#4B775E] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200'}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalSubmissions;
