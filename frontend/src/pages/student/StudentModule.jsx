import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModuleContent } from '../../services/hubApi';
import { ArrowLeft, BookOpen, Code, Terminal, Clock, Star, AlertCircle, Globe, CheckCircle } from 'lucide-react';

const StudentModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await fetchModuleContent(moduleId);
        setModule(data);
      } catch (err) {
        setError(err.message || 'Failed to load module contents.');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [moduleId]);

  const [activeTab, setActiveTab] = useState('questions');
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Practice');
  useEffect(() => {
    if (module) {
      if ((!module.questions || module.questions.length === 0) && module.articles?.length > 0) {
        setActiveTab('articles');
      } else {
        setActiveTab('questions');
      }
    }
  }, [module]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3 mt-6">
        <AlertCircle className="w-6 h-6" />
        <span className="font-medium">{error || 'Module not found'}</span>
        <button onClick={() => navigate(-1)} className="ml-auto underline text-sm">Go Back</button>
      </div>
    );
  }


  // Helper to get category questions
  const getCategoryQuestions = (category) => {
    if (!module?.questions) return [];
    if (category === 'Trainer') return module.questions.filter(q => q.category?.toLowerCase() === 'trainer');
    if (category === 'Labs') return module.questions.filter(q => q.category?.toLowerCase() === 'labs' || q.category?.toLowerCase() === 'lab');
    return module.questions.filter(q => q.category?.toLowerCase() === 'practice' || (!q.category?.toLowerCase().includes('trainer') && !q.category?.toLowerCase().includes('lab')));
  };

  const currentQuestions = getCategoryQuestions(activeCategory);

  return (
    <div className="space-y-8 mt-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to modules
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{module.title}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('questions')}
          className={`pb-4 flex items-center gap-2 font-medium text-sm transition-colors relative ${
            activeTab === 'questions' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code size={18} /> Practice Questions
          {activeTab === 'questions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('articles')}
          className={`pb-4 flex items-center gap-2 font-medium text-sm transition-colors relative ${
            activeTab === 'articles' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={18} /> Reading Material
          {activeTab === 'articles' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></div>
          )}
        </button>
      </div>

      <div className="mt-6">
        {/* Main Content Area - Questions */}
        {activeTab === 'questions' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Sub-tabs for Question Categories */}
            <div className="flex items-center gap-2 mb-6">
              {['Trainer', 'Practice', 'Labs'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeCategory === cat 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {currentQuestions.length > 0 ? (
                currentQuestions.map((q, index) => (
                  <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex items-start gap-4">
                    <div className="bg-slate-100 text-slate-500 font-bold w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-800">{q.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          q.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700' : 
                          q.difficulty?.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase() : 'Medium'}
                        </span>
                        
                        {q.companyTags && String(q.companyTags) !== '[]' && String(q.companyTags).trim() !== '' && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Star size={14} className="text-amber-400" /> 
                            {String(q.companyTags).replace(/[\[\]"]/g, '').split(',').slice(0, 2).join(', ')}
                            {String(q.companyTags).split(',').length > 2 && '...'}
                          </span>
                        )}
                        
                        {q.sourceUrl && (
                          <a 
                            href={q.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 hover:bg-indigo-100 hover:scale-105 transition-all text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Globe size={12} /> 
                            {q.sourceUrl.toLowerCase().includes('leetcode.com') ? 'LeetCode' :
                             q.sourceUrl.toLowerCase().includes('hackerrank.com') ? 'HackerRank' :
                             q.sourceUrl.toLowerCase().includes('codeforces.com') ? 'Codeforces' :
                             q.sourceUrl.toLowerCase().includes('geeksforgeeks.org') ? 'GeeksForGeeks' :
                             q.sourceUrl.toLowerCase().includes('codingninjas.com') ? 'CodingNinjas' :
                             (() => { try { return new URL(q.sourceUrl).hostname.replace('www.', '') } catch(e) { return 'External' } })()}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (q.sourceUrl) {
                          window.open(q.sourceUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          navigate(`/compiler?questionId=${q.id}&moduleId=${moduleId}`);
                        }
                      }}
                      className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        q.isSolved 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' 
                          : 'bg-slate-900 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {q.isSolved ? (
                        <>
                          <CheckCircle size={16} /> Re-solve
                        </>
                      ) : (
                        <>
                          <Terminal size={16} /> Solve
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <Code className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-500">No {activeCategory.toLowerCase()} questions in this module.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - Articles */}
        {activeTab === 'articles' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {module.articles && module.articles.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Sidebar - Article List */}
                <div className="w-full md:w-1/3 lg:w-1/4 space-y-2">
                  <h3 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3 pl-2">Topics in this Module</h3>
                  {module.articles.map((article, idx) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticleIndex(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border flex items-start gap-3 ${
                        selectedArticleIndex === idx
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen size={18} className={`mt-0.5 shrink-0 ${selectedArticleIndex === idx ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <span className={`block font-medium ${selectedArticleIndex === idx ? 'text-blue-800' : 'text-slate-600'}`}>
                          {article.topicName}
                        </span>
                        <span className="text-xs text-slate-400 mt-1 block">
                          {Math.ceil((article.articleContent?.length || 0) / 1000)} min read
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right Area - Article Content */}
                <div className="w-full md:w-2/3 lg:w-3/4">
                  <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                      {module.articles[selectedArticleIndex]?.topicName}
                    </h2>
                    <div className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-800 prose-a:text-blue-600 prose-pre:bg-slate-900 prose-pre:text-slate-50">
                      <ReactMarkdown>
                        {module.articles[selectedArticleIndex]?.articleContent
                          ? module.articles[selectedArticleIndex].articleContent
                              .replace(/(#{1,6}\s)/g, '\n\n$1')
                              .replace(/(```[a-z]*)/g, '\n\n$1\n')
                              .replace(/(---\s)/g, '\n\n---\n\n')
                              .replace(/(\s-\s)/g, '\n- ')
                          : 'No content available for this article.'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center p-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-600">No reading materials for this module.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import ErrorBoundary from '../../components/ErrorBoundary';

const StudentModuleWrapper = () => (
  <ErrorBoundary>
    <StudentModule />
  </ErrorBoundary>
);

export default StudentModuleWrapper;
