/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, ChevronRight, Settings, X, Search, ChevronDown, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exercise, SetLog, WorkoutSession, WeeklyPlan, DAYS_OF_WEEK } from '../types';
import { calculateEpley1RM, format1RM, calculateAutomaticRPE } from '../utils/fitness';

interface WorkoutLoggerProps {
  exercises: Exercise[];
  personalRecords: Record<string, { weight: number; reps: number; oneRM: number; date: string }>;
  plan: WeeklyPlan;
  onSaveSession: (session: WorkoutSession) => void;
}

export default function WorkoutLogger({ exercises, personalRecords, plan, onSaveSession }: WorkoutLoggerProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(exercises[0]?.id || '');
  const [sets, setSets] = useState<SetLog[]>([
    { id: '1', weight: 0, reps: 0, rpe: 8, completed: false },
  ]);
  
  // Search and Filter State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPR = personalRecords[selectedExerciseId];
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);

  // Get planned exercises for today
  const today = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Adjust for Sunday=0
  const plannedForToday = plan[today]?.exerciseIds || [];

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: SetLog = {
      id: Math.random().toString(36).substr(2, 9),
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      rpe: lastSet?.rpe || 8,
      completed: false,
    };
    setSets([...sets, newSet]);
  };

  const updateSet = (id: string, updates: Partial<SetLog>) => {
    setSets(sets.map((s) => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        // Automatic RPE calculation if weight or reps changed and it's not completed
        if ((updates.weight !== undefined || updates.reps !== undefined) && !updated.completed && currentPR) {
          updated.rpe = calculateAutomaticRPE(updated.weight, updated.reps, currentPR.oneRM);
        }
        return updated;
      }
      return s;
    }));
  };

  const removeSet = (id: string) => {
    if (sets.length > 1) {
      setSets(sets.filter((s) => s.id !== id));
    }
  };

  const handleSave = () => {
    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      exerciseId: selectedExerciseId,
      sets: sets.filter((s) => s.completed),
    };
    if (session.sets.length > 0) {
      onSaveSession(session);
      setSets([{ id: '1', weight: 0, reps: 0, rpe: 8, completed: false }]);
    }
  };

  const max1RM = Math.max(...sets.map(s => calculateEpley1RM(s.weight, s.reps)));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Log Workout</h2>
        <div className="flex items-center gap-4">
          {max1RM > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Session Max</p>
              <p className="text-lg font-mono font-bold text-emerald-600">{format1RM(max1RM)} kg</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Date Display */}
        <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-black/5">
          <CalendarIcon size={18} className="text-zinc-400" />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Workout Date</p>
            <p className="font-bold text-sm text-zinc-900">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Planned for Today */}
        {plannedForToday.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Planned for {today}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {plannedForToday.map(exId => {
                const ex = exercises.find(e => e.id === exId);
                if (!ex) return null;
                const isSelected = selectedExerciseId === exId;
                return (
                  <button
                    key={exId}
                    onClick={() => setSelectedExerciseId(exId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300'
                    }`}
                  >
                    {ex.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Selected Exercise</label>
          
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-zinc-300 transition-all group"
          >
            <div className="flex flex-col items-start">
              <span className="font-bold text-sm text-zinc-900">{selectedExercise?.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{selectedExercise?.category}</span>
            </div>
            <ChevronDown size={18} className={`text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-black/5 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-black/5 bg-zinc-50/50">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setSelectedExerciseId(ex.id);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                          selectedExerciseId === ex.id 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'hover:bg-zinc-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm">{ex.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{ex.category}</p>
                        </div>
                        {selectedExerciseId === ex.id && <Check size={16} strokeWidth={3} />}
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-xs font-medium text-zinc-400">No exercises found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[3rem_1fr_1fr_1fr_3rem] gap-2 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <div className="text-center">Set</div>
            <div>Weight</div>
            <div>Reps</div>
            <div>RPE</div>
            <div className="text-center">Done</div>
          </div>

          <AnimatePresence initial={false}>
            {sets.map((set, index) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`grid grid-cols-[3rem_1fr_1fr_1fr_3rem] gap-2 items-center p-2 rounded-xl transition-all group ${
                  set.completed ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-zinc-50 border border-transparent'
                }`}
              >
                <div className="text-center font-mono text-sm font-bold text-zinc-400">
                  {index + 1}
                </div>
                <input
                  type="number"
                  placeholder="kg"
                  value={set.weight || ''}
                  onChange={(e) => updateSet(set.id, { weight: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <input
                  type="number"
                  placeholder="reps"
                  value={set.reps || ''}
                  onChange={(e) => updateSet(set.id, { reps: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="rpe"
                    value={set.rpe || ''}
                    onChange={(e) => updateSet(set.id, { rpe: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                  {currentPR && !set.completed && (
                    <div className="absolute -top-2 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Auto-calculated RPE" />
                  )}
                </div>
                <button
                  onClick={() => updateSet(set.id, { completed: !set.completed })}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    set.completed
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-white border border-zinc-200 text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex gap-3">
          <button
            onClick={addSet}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Plus size={16} />
            Add Set
          </button>
          <button
            onClick={() => removeSet(sets[sets.length - 1].id)}
            className="px-4 py-3 border border-zinc-200 rounded-xl text-zinc-400 hover:text-red-500 hover:border-red-200 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-[0.98]"
        >
          Complete Session
        </button>
      </div>
    </div>
  );
}
