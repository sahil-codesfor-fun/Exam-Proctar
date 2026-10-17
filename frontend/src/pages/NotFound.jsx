import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, BookOpen, UserCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-950 text-white font-sans relative overflow-hidden px-4 sm:px-6">
      {/* Background Neon Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main 404 Card */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-8 p-8 sm:p-12 rounded-3xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
        
        {/* Animated 404 Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
          <ShieldAlert className="h-4 w-4" /> 404 Error • Page Not Found
        </div>

        {/* Big Glitch / Glow Number */}
        <div className="relative select-none">
          <span className="font-extrabold text-7xl sm:text-9xl tracking-tight bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg font-mono">
            404
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
            The page, assessment, or resource you are looking for might have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto rounded-full border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>

          <Button
            asChild
            className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/30"
          >
            <Link to="/">
              <Home className="h-4 w-4" /> Return Home
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-6 border-t border-slate-800/80">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
            Quick Navigation
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors border border-slate-700/50"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Student Portal
            </Link>
            <Link
              to="/fac"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors border border-slate-700/50"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Faculty Portal
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors border border-slate-700/50"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" /> Support Desk
            </Link>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Code Nexus • Smart Online Examination Platform
      </div>
    </div>
  );
}
