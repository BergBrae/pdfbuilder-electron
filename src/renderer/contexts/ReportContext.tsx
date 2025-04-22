import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { areReportsEqual } from '../components/utils';

// Types
export interface Section {
  type: string;
  bookmark_name: string;
  base_directory: string;
  children: Section[];
  method_codes?: string[];
}

interface ReportState {
  report: Section;
  originalReport: Section | null; // The report as it was last saved
  filePath: string | null;
  hasUnsavedChanges: boolean;
}

type ReportAction =
  | { type: 'SET_REPORT'; payload: Section }
  | { type: 'SET_FILE_PATH'; payload: string | null }
  | { type: 'SET_SAVED'; payload: boolean }
  | { type: 'MARK_SAVED' }
  | {
      type: 'UPDATE_SECTION';
      payload: { path: number[]; section: Partial<Section> };
    }
  | {
      type: 'ADD_CHILD';
      payload: { path: number[]; child: Section; index?: number };
    }
  | { type: 'DELETE_CHILD'; payload: { path: number[] } }
  | {
      type: 'MOVE_ITEM';
      payload: { parentPath: number[]; dragIndex: number; hoverIndex: number };
    };

interface ReportContextType {
  state: ReportState;
  dispatch: React.Dispatch<ReportAction>;
}

// Initial state
const initialReport: Section = {
  type: 'Section',
  bookmark_name: 'Quality Control Report',
  base_directory: '',
  children: [],
  method_codes: [],
};

const initialState: ReportState = {
  report: initialReport,
  originalReport: null,
  filePath: null,
  hasUnsavedChanges: false,
};

// Create context
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Reducer
function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'SET_REPORT':
      return {
        ...state,
        report: action.payload,
        originalReport: JSON.parse(JSON.stringify(action.payload)), // Deep copy
        hasUnsavedChanges: false,
      };

    case 'SET_FILE_PATH':
      return {
        ...state,
        filePath: action.payload,
      };

    case 'SET_SAVED':
      return {
        ...state,
        hasUnsavedChanges: action.payload,
      };

    case 'MARK_SAVED':
      return {
        ...state,
        originalReport: JSON.parse(JSON.stringify(state.report)), // Deep copy
        hasUnsavedChanges: false,
      };

    case 'UPDATE_SECTION': {
      const { path, section } = action.payload;
      const newReport = { ...state.report };
      let currentLevel = newReport;

      // Navigate to the parent of the target section
      for (let i = 0; i < path.length - 1; i++) {
        currentLevel = currentLevel.children[path[i]];
      }

      // Update the target section
      if (path.length === 0) {
        // Updating root section
        const updatedReport = { ...state.report, ...section };
        return {
          ...state,
          report: updatedReport,
          hasUnsavedChanges: !areReportsEqual(
            updatedReport,
            state.originalReport,
          ),
        };
      } else {
        // Updating nested section
        const lastIndex = path[path.length - 1];
        currentLevel.children[lastIndex] = {
          ...currentLevel.children[lastIndex],
          ...section,
        };
      }

      return {
        ...state,
        report: newReport,
        hasUnsavedChanges: !areReportsEqual(newReport, state.originalReport),
      };
    }

    case 'ADD_CHILD': {
      const { path, child, index } = action.payload;
      const newReport = { ...state.report };
      let currentLevel = newReport;

      // Navigate to the target section
      for (const pathIndex of path) {
        currentLevel = currentLevel.children[pathIndex];
      }

      // Add the new child at the specified index or at the end if no index provided
      if (typeof index === 'number') {
        currentLevel.children.splice(index, 0, child);
      } else {
        currentLevel.children.push(child);
      }

      return {
        ...state,
        report: newReport,
        hasUnsavedChanges: !areReportsEqual(newReport, state.originalReport),
      };
    }

    case 'DELETE_CHILD': {
      const { path } = action.payload;
      const newReport = { ...state.report };
      let currentLevel = newReport;

      // Navigate to the parent of the target section
      for (let i = 0; i < path.length - 1; i++) {
        currentLevel = currentLevel.children[path[i]];
      }

      // Remove the target child
      const lastIndex = path[path.length - 1];
      currentLevel.children.splice(lastIndex, 1);

      return {
        ...state,
        report: newReport,
        hasUnsavedChanges: !areReportsEqual(newReport, state.originalReport),
      };
    }

    case 'MOVE_ITEM': {
      const { parentPath, dragIndex, hoverIndex } = action.payload;
      const newReport = { ...state.report };
      let currentLevel = newReport;

      // Navigate to the correct level in the tree
      for (const index of parentPath) {
        currentLevel = currentLevel.children[index];
      }

      // Perform the swap
      const dragItem = currentLevel.children[dragIndex];
      const newChildren = [...currentLevel.children];
      newChildren.splice(dragIndex, 1);
      newChildren.splice(hoverIndex, 0, dragItem);
      currentLevel.children = newChildren;

      return {
        ...state,
        report: newReport,
        hasUnsavedChanges: !areReportsEqual(newReport, state.originalReport),
      };
    }

    default:
      return state;
  }
}

// Provider component
interface ReportProviderProps {
  children: ReactNode;
}

export function ReportProvider({ children }: ReportProviderProps) {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  return (
    <ReportContext.Provider value={{ state, dispatch }}>
      {children}
    </ReportContext.Provider>
  );
}

// Custom hook for using the report context
export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}
