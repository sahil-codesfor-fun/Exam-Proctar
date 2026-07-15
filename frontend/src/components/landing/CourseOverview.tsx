import React, { useState } from 'react';
import { ArrowUpRight, Clock, HelpCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const subjects = [
  { id: 'ac', initials: 'AC', name: 'Accountancy', color: 'border-teal-500 text-teal-800 bg-teal-50' },
  { id: 'bi', initials: 'BI', name: 'Biology', color: 'border-purple-500 text-purple-800 bg-purple-50' },
  { id: 'bu', initials: 'BU', name: 'Business Studies', color: 'border-orange-500 text-orange-800 bg-orange-50' },
  { id: 'ch', initials: 'CH', name: 'Chemistry', color: 'border-blue-500 text-blue-800 bg-blue-50' },
];

const mockTests = [
  { id: 1, title: 'Humanities & Social Sciences - Set 3 (7326)', duration: '240m', questions: '200 Qs' },
  { id: 2, title: 'Humanities & Social Sciences - Set 2 (7151)', duration: '240m', questions: '200 Qs' },
  { id: 3, title: 'Humanities & Social Sciences - Set 1 (6980)', duration: '240m', questions: '200 Qs' },
  { id: 4, title: 'B.A. (Arts) - Set 1 (3726)', duration: '240m', questions: '200 Qs' },
];

export function CourseOverview() {
  const [activeTab, setActiveTab] = useState('subjects');

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          <span className="text-yellow-400">✧</span> COURSE OVERVIEW
        </div>
        <h2 className="mt-4 font-display text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
          CUET (UG)
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Select a subject to dive deep, or take a full-length mock test.
        </p>
      </div>

      <div className="mb-8 inline-flex items-center rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'subjects'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Subjects
        </button>
        <button
          onClick={() => setActiveTab('mocks')}
          className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'mocks'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Full Mock Tests
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'subjects' ? (
          subjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/courses/${subject.id}`}
              className="group flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                <div
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 text-lg font-bold ${subject.color}`}
                >
                  {subject.initials}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-slate-500">Explore Chapters & Tests</p>
                </div>
              </div>
              <div className="mr-2 text-slate-300 transition-colors group-hover:text-slate-500">
                <ArrowUpRight className="h-6 w-6" />
              </div>
            </Link>
          ))
        ) : (
          mockTests.map((test) => (
            <div
              key={test.id}
              className="flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-5 transition-all hover:border-slate-200 hover:shadow-sm sm:p-6"
            >
              <div className="flex items-start gap-4 sm:items-center">
                <div className="relative mt-1 shrink-0 sm:mt-0">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-orange-400">
                    <div className="h-full w-full bg-emerald-500" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
                  </div>
                  <div className="absolute inset-0 m-auto flex h-full w-full items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                    {test.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {test.duration}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4" />
                      {test.questions}
                    </div>
                  </div>
                </div>
              </div>
              <Button className="shrink-0 rounded-xl bg-black px-6 hover:bg-slate-800">
                Start Test <Play className="ml-2 h-4 w-4 fill-white" />
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
