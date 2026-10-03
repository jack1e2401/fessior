import { create } from 'zustand';
import type { IMatch, IProblem } from '@ocj/contracts';

interface MatchState {
  /** Active PvP match (null = solo mode) */
  activeMatch: IMatch | null;
  /** Problem selected from problem list */
  selectedProblem: IProblem | null;
  /** Editor language preference */
  editorLanguage: 'cpp' | 'java' | 'python';
  /** Finding match flag */
  isFinding: boolean;

  // Actions
  setActiveMatch: (match: IMatch | null) => void;
  setSelectedProblem: (problem: IProblem | null) => void;
  setEditorLanguage: (lang: 'cpp' | 'java' | 'python') => void;
  setIsFinding: (finding: boolean) => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  activeMatch: null,
  selectedProblem: null,
  editorLanguage: 'python',
  isFinding: false,

  setActiveMatch: (match) => set({ activeMatch: match }),
  setSelectedProblem: (problem) => set({ selectedProblem: problem }),
  setEditorLanguage: (lang) => set({ editorLanguage: lang }),
  setIsFinding: (finding) => set({ isFinding: finding }),
  resetMatch: () =>
    set({
      activeMatch: null,
      selectedProblem: null,
      isFinding: false,
    }),
}));
