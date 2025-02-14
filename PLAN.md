# PDFBuilder Context/Reducer Migration Plan

## Overview

This plan outlines the changes needed to migrate the application from prop drilling to a centralized state management using React Context and reducers. This will simplify state management across components (e.g., Section, DocxTemplate, FileType) and eliminate the need to pass callbacks like `onSectionChange`, `onTemplateChange`, etc.

## Goals

- Manage global report state using Context and a reducer.
- Remove prop drilling from nested components.
- Provide centralized state update actions and simplify updates for nested structures like sections, templates, and file types.
- Support both Windows and macOS (ensuring any os-specific behavior remains intact).

## Steps to Implement

### 1. Create the Report Context and Reducer

- Create a new context file (e.g., `src/contexts/ReportContext.js`).
- Define the initial state structure and reducer actions (e.g., UPDATE_REPORT, UPDATE_SECTION, ADD_CHILD, DELETE_ELEMENT, etc.).
- Export a provider (`ReportProvider`) to wrap the application.

### 2. Update the App Component

- Remove local state management (e.g., report state, setReport) in `App.tsx`.
- Wrap the main application component tree with the `ReportProvider`.
- Replace handlers like `handleSectionChange` to dispatch actions to update the state via the context.

### 3. Refactor Child Components

#### a. Section Component

- Remove props such as `onSectionChange`, `onDelete`, and `report` from the component signature.
- Use `useContext(ReportContext)` to get the state and dispatch.
- Replace local update functions (e.g., handleChildChange, handleVariableChange) with dispatch actions.

#### b. DocxTemplate Component

- Remove the `onTemplateChange` and `report` props.
- Similarly, use context to dispatch updates instead of prop callbacks.

#### c. FileType Component

- Remove the `onFileChange` and `onDelete` props, replacing them with context dispatch actions.
- Continue handling local state (if any) separately, but update global state through the context.

#### d. Other Components

- Follow a similar pattern for any other components that rely on prop drilling for state updates (e.g., AddComponent, Outline if needed).

### 4. Define Actions and Reducer Logic

- Define clear action types for updating the report (e.g., SET_REPORT, UPDATE_SECTION, ADD_CHILD, DELETE_CHILD, etc.).
- Ensure that the reducer can handle nested updates for sections and sub-sections.
- Incorporate any required logic that was previously within the prop-based callbacks.

### 5. Testing and OS Support

- Test the application on both Windows and macOS. The OS-specific parts (e.g., path handling and IPC dialogs) should remain unaffected as long as they are not intertwined with state management.
- Validate that the context-based state updates work correctly in all nested components.

## Final Considerations

- Ensure thorough testing of the new context-based architecture.
- Refactor related utility functions if necessary to work seamlessly with the new state structure.
- Consider creating additional custom hooks for common actions from the ReportContext.
- Verify that any local component state which does not affect global state can remain local, and separate it clearly from global synchronization logic.

## Additional Considerations and Future Enhancements

- Migrate the Report Context file to TypeScript (e.g., ReportContext.tsx) to align with the rest of the application.
- Document any assumptions made about the report data structure and how nested updates are handled in the reducer.
- Incorporate error boundaries or logging within the context provider to catch any unexpected state updates.
- Ensure that test cases cover the new context and reducer logic, especially around nested state updates.
- Revisit components such as AddComponent and Outline to remove any remaining traces of prop drilling and fully integrate with the new global state.
- Confirm that OS-specific functionalities (like file path resolving and IPC dialogs) continue to operate correctly without interference from the global state management.
