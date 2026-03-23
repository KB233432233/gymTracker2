/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Exercise = {
  id: string;
  name: string;
  category: string; // e.g., 'Chest', 'Back', 'Legs'
};

export type SetLog = {
  id: string;
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
};

export type WorkoutSession = {
  id: string;
  date: string;
  exerciseId: string;
  sets: SetLog[];
};

export type DayPlan = {
  exerciseIds: string[];
  note?: string;
};

export type WeeklyPlan = {
  [key: string]: DayPlan;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press', category: 'Chest' },
  { id: '2', name: 'Squat', category: 'Legs' },
  { id: '3', name: 'Deadlift', category: 'Back' },
  { id: '4', name: 'Overhead Press', category: 'Shoulders' },
  { id: '5', name: 'Pull Ups', category: 'Back' },
  { id: '6', name: 'Barbell Row', category: 'Back' },
];
