import React from 'react'


export default function Help () {
  return (
    <div>
      <h5>Docx Template</h5>
      <p>Docx templates are useful for making pages that have text that varies between reports.</p>
      <p>How to use:</p>
      <ol>
        <li>In the Word document, use this notation to flag a variable to be replaced: <code>{`{variable_name}`}</code>.</li>
        <li>Then when you add the file to PDFBuilder, <code>{`variable_name`}</code> will show as a field where you can specify the value for the current report.</li>
        <li>When the report is built, <code>{`{variable_name}`}</code> is replaced with the text you specified and converted to a pdf.</li>
      </ol>

      <h5>PDF Type</h5>
      <p>A PDF type is specified by the content of file names.</p>
      <p>How to use:</p>
      <ul>
        <li>To match a file that contains a certain text, enter the text with or without quotes.</li>
        <li>For more complex matching, you can use the <b>and</b>, <b>or</b> and <b>not</b> keywords and parentheses. Quotes must be around text to match when using keywords.</li>
        <li>Examples:
          <ul>
            <li><code>{`"report"`}</code>/<code>report</code> match all files containing the word "report"</li>
            <li><code>{`"report" and "2020"`}</code> matches all files containing both "report" and "2020"</li>
            <li><code>{`"report" or "2020"`}</code> matches all files containing either "report" or "2020"</li>
            <li><code>{`"report" and not "2020"`}</code> matches all files containing "report" but not "2020"</li>
            <li><code>{`("report" or "2020") and not "2021"`}</code> matches all files containing either "report" or "2020" but not "2021"</li>
          </ul>
        </li>
        <li>When a PDF Type matches an existing file, it will turn green and display the matching files below sorted alphabetically.</li>
      </ul>

      <h5>Section</h5>
      <p>Sections are used to nest bookmarks and/or specify files from a nested directory.</p>
      <p>How to use:</p>
      <ul>
        <li>Each section's base directory is relative to its parent section except for the top-level section which uses an absolute path.</li>
        <li>When a template is created for a report only one section's directory should need to be changed for the template to point at the new report's files.</li>
      </ul>
    </div>
  )
}
