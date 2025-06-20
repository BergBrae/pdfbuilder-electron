export default function ChangeLog() {
  return (
    <div>
      <h5>Version 2.2.2</h5>
      <ul>
        <li>Updated the help section</li>
      </ul>
      <h5>Version 2.2.1</h5>
      <ul>
        <li>
          Fixed an issue that prevented building when using reordering for{' '}
          <em>metals form 1</em>
        </li>
        <li>Fixed an issue that prevented exiting the bookmark rules modal</li>
      </ul>
      <h5>Version 2.2.0</h5>
      <ul>
        <li>
          Docx files now have data populated from analytical report information
        </li>
        <li>
          Default paths for files within 'Create from Analytical Report' can be
          set in settings
        </li>
        <li>
          'PDF Type' has become 'File Type' and now supports docx files. 'Docx
          Template' has been removed
        </li>
        <li>Added the ability to duplicate sections</li>
        <li>
          Added the ability to add COA and Designated Benchsheets folders when
          creating from analytical report
        </li>
        <li>
          Merit ID bookmarking now ignores pages that contain 'Merit
          Laboratories Bottle Preservation Check'
        </li>
        <li>
          Merit ID bookmark rule now considers text like 'Data File 7168102' as
          'S71681.02'
        </li>
        <li>
          Fixed an issue that prevented editing bookmarks for individual files
        </li>
        <li>
          Create from analytical report now shows a summary of created folders
          and files
        </li>
      </ul>
      <h5>Version 2.1.1</h5>
      <ul>
        <li>
          Fixed an issue when keeping existing bookmarks. Hierarchial bookmarks
          are now preserved. Fixed a bug in the toggle button
        </li>
      </ul>
      <h5>Version 2.1.0</h5>
      <ul>
        <li>
          Added a 'Create from Analytical Report' option for initialization
        </li>
      </ul>
      <h5>Version 2.0.1</h5>
      <ul>
        <li>Added Microsoft Office-like saving and closing behavior</li>
        <li>Improved error handling for malformed bookmarks in PDFs</li>
        <li>Fixed nested FileType updates in report structure</li>
        <li>Improved root section positioning and scrolling behavior</li>
        <li>
          Enhanced DocxTemplate component with better variable handling and
          state management
        </li>
        <li>Fixed file counting in Sections and Outline components</li>
        <li>
          Improved display of file names using basenames instead of full paths
        </li>
        <li>
          Added confirmation dialog for unsaved changes when closing the app
        </li>
      </ul>
      <h5>Version 2.0.0</h5>
      <ul>
        <li>Changed the way the underlying data is handled</li>
        <li>Minor cosmetic changes</li>
      </ul>
      <h5>Version 1.5.5</h5>
      <ul>
        <li>
          Bug fixes and performance improvements related to Merit ID bookmarking
        </li>
        <li>Added the ability to see the number of files found</li>
      </ul>
      <h5>Version 1.5.4</h5>
      <ul>
        <li>Added the ability to reorder elements in the outline</li>
      </ul>
      <h5>Version 1.4.4</h5>
      <ul>
        <li>
          Bug fixes and performance improvements related to: Changing base
          directory, Refreshing, Loading templates
        </li>
      </ul>
      <h5>Version 1.4.3</h5>
      <ul>
        <li>
          Fixed bookmarks sometimes being off by one page when using a table of
          contents
        </li>
        <li>
          Added the ability to specify if existing bookmarks are kept on a
          PDFType-level <strong>Note:</strong> You may need to re-enable
          reordering options in saved templates.
        </li>
      </ul>
      <h5>Version 1.4.2</h5>
      <ul>
        <li>Fixed editing bookmarks</li>
        <li>Fixed reordering pages</li>
        <li>Fixed bookmark rules</li>
      </ul>
      <h5>Version 1.4.1</h5>
      <ul>
        <li>Minor bug fixes and improvements</li>
      </ul>
      <h5>Version 1.4.0</h5>
      <ul>
        <li>
          Fixed an issue that caused the app to get stuck in a loading state
        </li>
        <li>
          Existing bookmarks within PDFs are carried over to the new PDF, but
          not present in the Table of Contents
        </li>
        <li>
          Added a new type of reordering for datetime and manually integrated
          pages.
        </li>
        <li>Added auto-update feature</li>
        <li>Added 'What's New?' section</li>
      </ul>
    </div>
  );
}
