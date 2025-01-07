export default function ChangeLog() {
  return (
    <div>
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
        <li>Added "What's New?" section</li>
      </ul>
    </div>
  );
}
