/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Dumbbell, TrendingUp, Calendar as CalendarIcon, Trophy, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Exercise, WorkoutSession, WeeklyPlan, DEFAULT_EXERCISES, DAYS_OF_WEEK, WorkoutTemplate } from './types';
import WorkoutLogger from './components/WorkoutLogger';
import WeeklyPlanner from './components/WeeklyPlanner';
import { calculateEpley1RM, format1RM } from './utils/fitness';

export default function App() {
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan>({
    'Monday': { exerciseIds: ['1'], note: 'Heavy chest day' },
    'Wednesday': { exerciseIds: ['2'], note: 'Focus on depth' },
    'Friday': { exerciseIds: ['3'], note: 'Conventional pull' },
  });
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logger' | 'planner'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from server or localStorage
  useEffect(() => {
    async function fetchData() {
      try {
        const [exRes, sessRes, planRes, tempRes] = await Promise.all([
          fetch('/api/exercises'),
          fetch('/api/sessions'),
          fetch('/api/plan'),
          fetch('/api/templates')
        ]);

        if (!exRes.ok || !sessRes.ok || !planRes.ok || !tempRes.ok) {
          throw new Error('API not available');
        }

        const exData = await exRes.json();
        const sessData = await sessRes.json();
        const planData = await planRes.json();
        const tempData = await tempRes.json();

        // If server is empty, try to sync from localStorage
        if (exData.length === 0 && sessData.length === 0 && Object.keys(planData).length === 0) {
          const savedExercises = localStorage.getItem('irontrack_exercises');
          const savedSessions = localStorage.getItem('irontrack_sessions');
          const savedPlan = localStorage.getItem('irontrack_plan');
          const savedTemplates = localStorage.getItem('irontrack_templates');

          if (savedExercises || savedSessions || savedPlan || savedTemplates) {
            const localExercises = savedExercises ? JSON.parse(savedExercises) : DEFAULT_EXERCISES;
            const localSessions = savedSessions ? JSON.parse(savedSessions) : [];
            const localPlan = savedPlan ? JSON.parse(savedPlan) : plan;
            const localTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];

            // Sync to server (optional, will fail if no server)
            try {
              await Promise.all([
                ...localExercises.map((ex: Exercise) => fetch('/api/exercises', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(ex)
                })),
                ...localSessions.map((sess: WorkoutSession) => fetch('/api/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(sess)
                })),
                fetch('/api/plan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(localPlan)
                }),
                ...localTemplates.map((temp: WorkoutTemplate) => fetch('/api/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(temp)
                }))
              ]);
            } catch (e) {
              console.warn('Failed to sync to server, using local data');
            }

            setExercises(localExercises);
            setSessions(localSessions);
            setPlan(localPlan);
            setTemplates(localTemplates);
          }
        } else {
          setExercises(exData.length > 0 ? exData : DEFAULT_EXERCISES);
          setSessions(sessData);
          setPlan(Object.keys(planData).length > 0 ? planData : plan);
          setTemplates(tempData);
        }
      } catch (error) {
        console.warn('Failed to fetch from API, falling back to localStorage:', error);
        const savedExercises = localStorage.getItem('irontrack_exercises');
        const savedSessions = localStorage.getItem('irontrack_sessions');
        const savedPlan = localStorage.getItem('irontrack_plan');
        const savedTemplates = localStorage.getItem('irontrack_templates');

        if (savedExercises) setExercises(JSON.parse(savedExercises));
        if (savedSessions) setSessions(JSON.parse(savedSessions));
        if (savedPlan) setPlan(JSON.parse(savedPlan));
        if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Persist to localStorage as fallback
  useEffect(() => {
    localStorage.setItem('irontrack_exercises', JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem('irontrack_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('irontrack_plan', JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    localStorage.setItem('irontrack_templates', JSON.stringify(templates));
  }, [templates]);

  const handleSaveSession = async (session: WorkoutSession) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
    } catch (error) {
      console.warn('Failed to save session to server, saved locally');
    }
    setSessions([session, ...sessions]);
    setActiveTab('dashboard');
  };

  const handleAddExercise = async (newEx: Exercise) => {
    try {
      await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEx)
      });
    } catch (error) {
      console.warn('Failed to add exercise to server, saved locally');
    }
    setExercises([...exercises, newEx]);
  };

  const handleAddTemplate = async (newTemplate: WorkoutTemplate) => {
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
    } catch (error) {
      console.warn('Failed to add template to server, saved locally');
    }
    setTemplates([...templates, newTemplate]);
  };

  const handleUpdatePlan = async (newPlan: WeeklyPlan) => {
    try {
      await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
    } catch (error) {
      console.warn('Failed to update plan on server, saved locally');
    }
    setPlan(newPlan);
  };

  const personalRecords = useMemo(() => {
    const prs: Record<string, { weight: number; reps: number; oneRM: number; date: string }> = {};
    
    sessions.forEach(session => {
      session.sets.forEach(set => {
        const oneRM = calculateEpley1RM(set.weight, set.reps);
        if (!prs[session.exerciseId] || oneRM > prs[session.exerciseId].oneRM) {
          prs[session.exerciseId] = {
            weight: set.weight,
            reps: set.reps,
            oneRM,
            date: session.date
          };
        }
      });
    });
    
    return prs;
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading IronTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-max z-50 bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl px-2 py-2 sm:px-4 sm:py-3 shadow-2xl flex items-center justify-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <TrendingUp size={18} />
          <span className="text-xs sm:text-sm font-bold">Stats</span>
        </button>
        <button
          onClick={() => setActiveTab('logger')}
          className={`relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'logger' ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <Dumbbell size={18} />
          <span className="text-xs sm:text-sm font-bold">Log</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'planner' ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <CalendarIcon size={18} />
          <span className="text-xs sm:text-sm font-bold">Plan</span>
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-32">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Dumbbell size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">IronTrack</h1>
          </div>
          <p className="text-zinc-500 font-medium">Precision training for peak performance.</p>
        </header>

        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Sessions</p>
                <p className="text-4xl font-black tracking-tighter">{sessions.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Weekly Goal</p>
                <p className="text-4xl font-black tracking-tighter">4 <span className="text-lg text-zinc-300">/ 5</span></p>
              </div>
              <div className="bg-emerald-500 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Current Streak</p>
                <p className="text-4xl font-black tracking-tighter">12 Days</p>
              </div>
            </div>

            {/* Personal Records */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">Personal Records</h2>
                <button className="text-sm font-bold text-emerald-600 hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(personalRecords).length > 0 ? (
                  Object.entries(personalRecords).map(([exId, pr]) => {
                    const ex = exercises.find(e => e.id === exId);
                    const record = pr as { weight: number; reps: number; oneRM: number; date: string };
                    return (
                      <motion.div
                        key={exId}
                        whileHover={{ y: -4 }}
                        className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{ex?.category}</p>
                            <h3 className="font-bold text-zinc-900">{ex?.name}</h3>
                          </div>
                          <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                            <Trophy size={16} />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-2xl font-black tracking-tighter">{record.weight} <span className="text-sm font-medium text-zinc-400">kg</span></p>
                            <p className="text-[10px] font-medium text-zinc-400">for {record.reps} reps</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-600">1RM: {format1RM(record.oneRM)}</p>
                            <p className="text-[10px] font-medium text-zinc-300">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 bg-white rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                    <Trophy size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="font-medium mb-6">No records yet. Start logging!</p>
                    <button 
                      onClick={() => setActiveTab('logger')}
                      className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10"
                    >
                      Log Your First Set
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-6">Recent Activity</h2>
              <div className="space-y-3">
                {sessions.slice(0, 5).map(session => {
                  const ex = exercises.find(e => e.id === session.exerciseId);
                  return (
                    <div key={session.id} className="bg-white p-4 rounded-2xl border border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                          <Dumbbell size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{ex?.name}</h4>
                          <p className="text-[10px] font-medium text-zinc-400">
                            {session.sets.length} sets • {new Date(session.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300" />
                    </div>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'logger' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <WorkoutLogger 
              exercises={exercises} 
              personalRecords={personalRecords}
              plan={plan}
              onSaveSession={handleSaveSession} 
            />
          </motion.div>
        )}

        {activeTab === 'planner' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <WeeklyPlanner 
              exercises={exercises} 
              plan={plan} 
              templates={templates}
              onUpdatePlan={handleUpdatePlan} 
              onAddExercise={handleAddExercise}
              onAddTemplate={handleAddTemplate}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
