import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Variable {
  name: string;
  value: string;
}

export interface Section {
  type: string;
  bookmark_name: string;
  base_directory: string;
  variables: Variable[];
  children: Section[];
}

interface ReportState {
  report: Section;
}

type ReportAction =
  | { type: 'SET_REPORT'; payload: Section }
  | {
      type: 'UPDATE_SECTION';
      payload: { path: number[]; section: Partial<Section> };
    }
  | { type: 'ADD_CHILD'; payload: { path: number[]; child: Section } }
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
  variables: [],
  children: [],
};

const initialState: ReportState = {
  report: initialReport,
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
        return {
          ...state,
          report: { ...state.report, ...section },
        };
      } else {
        // Updating nested section
        const lastIndex = path[path.length - 1];
        currentLevel.children[lastIndex] = {
          ...currentLevel.children[lastIndex],
          ...section,
        };
      }

      return { ...state, report: newReport };
    }

    case 'ADD_CHILD': {
      const { path, child } = action.payload;
      const newReport = { ...state.report };
      let currentLevel = newReport;

      // Navigate to the target section
      for (const index of path) {
        currentLevel = currentLevel.children[index];
      }

      // Add the new child
      currentLevel.children.push(child);

      return { ...state, report: newReport };
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

      return { ...state, report: newReport };
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

      return { ...state, report: newReport };
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
