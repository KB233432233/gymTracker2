/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Check, Dumbbell, Coffee, Zap, Save, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DAYS_OF_WEEK, Exercise, WeeklyPlan, WorkoutTemplate } from '../types';

interface WeeklyPlannerProps {
  exercises: Exercise[];
  plan: WeeklyPlan;
  templates: WorkoutTemplate[];
  onUpdatePlan: (plan: WeeklyPlan) => void;
  onAddExercise: (ex: Exercise) => void;
  onAddTemplate: (template: WorkoutTemplate) => void;
}

export default function WeeklyPlanner({ 
  exercises, 
  plan, 
  templates, 
  onUpdatePlan, 
  onAddExercise,
  onAddTemplate 
}: WeeklyPlannerProps) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Chest');
  const [templateName, setTemplateName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

  const filteredExercises = selectedCategory === 'All' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  const toggleExerciseInDay = (day: string, exerciseId: string) => {
    const currentDayPlan = plan[day] || { exerciseIds: [], note: '' };
    let newExerciseIds;
    if (currentDayPlan.exerciseIds.includes(exerciseId)) {
      newExerciseIds = currentDayPlan.exerciseIds.filter((id) => id !== exerciseId);
    } else {
      newExerciseIds = [...currentDayPlan.exerciseIds, exerciseId];
    }
    onUpdatePlan({ 
      ...plan, 
      [day]: { ...currentDayPlan, exerciseIds: newExerciseIds } 
    });
  };

  const updateNote = (day: string, note: string) => {
    const currentDayPlan = plan[day] || { exerciseIds: [], note: '' };
    onUpdatePlan({
      ...plan,
      [day]: { ...currentDayPlan, note }
    });
  };

  const applyTemplate = (day: string, template: WorkoutTemplate) => {
    const currentDayPlan = plan[day] || { exerciseIds: [], note: '' };
    onUpdatePlan({ 
      ...plan, 
      [day]: { ...currentDayPlan, exerciseIds: [...template.exerciseIds] } 
    });
  };

  const handleSaveTemplate = () => {
    if (editingDay && templateName.trim()) {
      const currentExercises = plan[editingDay]?.exerciseIds || [];
      if (currentExercises.length === 0) return;

      const newTemplate: WorkoutTemplate = {
        id: Math.random().toString(36).substr(2, 9),
        name: templateName.trim(),
        exerciseIds: [...currentExercises],
      };
      onAddTemplate(newTemplate);
      setIsSavingTemplate(false);
      setTemplateName('');
    }
  };

  const handleCreateExercise = () => {
    if (newExName.trim()) {
      const newEx: Exercise = {
        id: Math.random().toString(36).substr(2, 9),
        name: newExName.trim(),
        category: newExCategory,
      };
      onAddExercise(newEx);
      if (editingDay) {
        toggleExerciseInDay(editingDay, newEx.id);
      }
      setIsAddingExercise(false);
      setNewExName('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-bottom border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Weekly Planner</h2>
            <p className="text-xs text-zinc-500 font-medium">Schedule your workout split</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 border-t border-black/5">
        {DAYS_OF_WEEK.map((day) => {
          const dayPlan = plan[day] || { exerciseIds: [], note: '' };
          const dayExercises = dayPlan.exerciseIds;
          const isRestDay = dayExercises.length === 0;
          
          return (
            <div
              key={day}
              className={`min-h-[220px] border-r border-b border-black/5 last:border-r-0 p-4 transition-all group cursor-pointer relative overflow-hidden ${
                isRestDay 
                  ? 'bg-zinc-50/30 hover:bg-zinc-50' 
                  : 'bg-indigo-50/20 hover:bg-indigo-50/40'
              }`}
              onClick={() => setEditingDay(day)}
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  isRestDay ? 'text-zinc-400' : 'text-indigo-500'
                }`}>
                  {day.substring(0, 3)}
                </span>
                {isRestDay ? (
                  <Coffee size={14} className="text-zinc-300" />
                ) : (
                  <Zap size={14} className="text-indigo-400" />
                )}
              </div>
              
              <div className="space-y-1.5 relative z-10 mb-3">
                {!isRestDay ? (
                  dayExercises.map((exId) => {
                    const ex = exercises.find((e) => e.id === exId);
                    return (
                      <div
                        key={exId}
                        className="text-[10px] font-bold bg-white border border-indigo-100 rounded-lg px-2 py-1.5 shadow-sm truncate text-indigo-900"
                      >
                        {ex?.name}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-24 flex flex-col items-center justify-center opacity-20">
                    <Coffee size={24} strokeWidth={1.5} className="mb-1 text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rest</span>
                  </div>
                )}
              </div>

              {dayPlan.note && (
                <div className="relative z-10 mt-auto pt-2 border-t border-black/5">
                  <p className="text-[9px] font-medium text-zinc-500 italic line-clamp-2">
                    "{dayPlan.note}"
                  </p>
                </div>
              )}

              {/* Background accent for active days */}
              {!isRestDay && (
                <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                  <Dumbbell size={80} strokeWidth={1} />
                </div>
              )}
              
              {/* Add button hint */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-white rounded-full shadow-sm border border-black/5 flex items-center justify-center text-zinc-400">
                  <Plus size={12} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setEditingDay(null);
              setIsSavingTemplate(false);
              setIsAddingExercise(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row h-[80vh] md:h-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Panel: Exercise Selection */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{editingDay}</h3>
                    <p className="text-xs text-zinc-400 font-medium">Select exercises</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddingExercise(true)}
                      className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-zinc-100 transition-colors"
                      title="Add Custom Exercise"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Note Section */}
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Workout Note</label>
                    <textarea
                      placeholder="e.g. Focus on tempo, keep rest short..."
                      value={plan[editingDay]?.note || ''}
                      onChange={(e) => updateNote(editingDay, e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none h-20 font-medium"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Exercises</label>
                    </div>
                    
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            selectedCategory === cat
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-black/5 text-zinc-500 hover:border-zinc-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {filteredExercises.length > 0 ? (
                        filteredExercises.map((ex) => {
                          const isSelected = (plan[editingDay]?.exerciseIds || []).includes(ex.id);
                          return (
                            <button
                              key={ex.id}
                              onClick={() => toggleExerciseInDay(editingDay, ex.id)}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:border-zinc-300'
                              }`}
                            >
                              <div className="text-left">
                                <p className="font-bold text-sm">{ex.name}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-60">{ex.category}</p>
                              </div>
                              {isSelected && <Check size={18} strokeWidth={3} />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                          <p className="text-xs font-medium text-zinc-400">No exercises in this category</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-zinc-50 border-t border-black/5">
                  <button
                    onClick={() => setEditingDay(null)}
                    className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Right Panel: Templates */}
              <div className="w-full md:w-72 bg-zinc-50 border-l border-black/5 flex flex-col min-h-0">
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Templates</h4>
                  <button 
                    onClick={() => setIsSavingTemplate(true)}
                    disabled={(plan[editingDay]?.exerciseIds || []).length === 0}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-30"
                    title="Save current as template"
                  >
                    <Save size={18} />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(editingDay, template)}
                        className="w-full text-left p-3 bg-white border border-black/5 rounded-xl hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-zinc-900">{template.name}</p>
                          <Copy size={12} className="text-zinc-300 group-hover:text-indigo-400" />
                        </div>
                        <p className="text-[10px] text-zinc-400">{template.exerciseIds.length} exercises</p>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-[10px] font-medium text-zinc-400 italic">No templates saved</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Overlay: Save Template Form */}
              <AnimatePresence>
                {isSavingTemplate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-8 flex flex-col justify-center"
                  >
                    <div className="mb-8">
                      <h3 className="text-xl font-black tracking-tighter uppercase italic mb-2">Save Template</h3>
                      <p className="text-xs text-zinc-500">Give this workout routine a name</p>
                    </div>
                    <div className="space-y-4">
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Push Day A"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsSavingTemplate(false)}
                          className="flex-1 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          disabled={!templateName.trim()}
                          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overlay: Add Exercise Form */}
              <AnimatePresence>
                {isAddingExercise && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 z-20 bg-white p-8 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <Dumbbell size={20} className="text-emerald-500" />
                        <h3 className="text-lg font-bold text-zinc-900">New Exercise</h3>
                      </div>
                      <button onClick={() => setIsAddingExercise(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Name</label>
                        <input
                          autoFocus
                          type="text"
                          placeholder="e.g. Incline DB Press"
                          value={newExName}
                          onChange={(e) => setNewExName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Category</label>
                        <select
                          value={newExCategory}
                          onChange={(e) => setNewExCategory(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold"
                        >
                          {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleCreateExercise}
                        disabled={!newExName.trim()}
                        className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                      >
                        Add & Select
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
