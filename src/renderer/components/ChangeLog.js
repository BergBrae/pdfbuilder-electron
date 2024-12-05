export default function ChangeLog() {
  return (
    <div>
      <h5>Version 1.4.2</h5>
      <ul>
        <li>Fixed editing bookmarks</li>
        <li>Fixed reordering pages</li>
        <li>Fixed bookmark rules</li>
        <li>
          <strong>Known Issue:</strong> The presence of a table of contents can
          cause the bookmarks to be off by one page
        </li>
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
