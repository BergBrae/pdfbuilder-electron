import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';

export default function Help() {
  return (
    <div>
      <h6>
        PDFBuilder is used to create templates for reports. This is done using
        three building blocks: Docx Templates, PDF Types, and Sections. Please
        read more on each below.
      </h6>
      <Tabs defaultActiveKey="pdftype" id="help-tabs" className="mb-3">
        <Tab eventKey="pdftype" title="PDF Type">
          <PdfTypeHelp />
        </Tab>
        <Tab eventKey="section" title="Section">
          <SectionHelp />
        </Tab>
      </Tabs>
    </div>
  );
}

function DocxTemplateHelp() {
  // Updated DocxTemplateHelp function with simpler language
  return (
    <div className="help-content">
      <h4>
        <b>Docx Template</b>
      </h4>
      <p>
        A Docx Template lets you create pages with text that can change between
        reports. It's also used to create a table of contents. You must have
        Word 2010 or later installed on your machine.
      </p>
      <h5>Text Replacement</h5>
      <ol>
        <li>
          In your Word document, mark variables to replace using{' '}
          <code>
            {'${'}variable_name{'}'}
          </code>
          .
        </li>
        <li>
          When you add the file to PDFBuilder, <code>variable_name</code> will
          appear as a field where you can enter its value for the current
          report.
        </li>
        <li>
          When building the report,{' '}
          <code>
            {'${'}variable_name{'}'}
          </code>{' '}
          will be replaced with the text you specified.
        </li>
      </ol>
      <h5>Table of Contents</h5>
      <p>PDFBuilder can create a table of contents from your bookmarks.</p>
      <ol>
        <li>
          Enable <code>Has Table of Contents</code> in the Docx Template
          settings.
        </li>
        <li>
          Enter the column numbers where the page numbers start and end. The
          leftmost column is 1. The page start column is required; the page end
          column is optional.
        </li>
        <li>
          Set the <code>Page Number Offset</code> to the number of pages before
          the first page of the report. This offset will be added to each page
          number in the table of contents.
        </li>
      </ol>
      <p>
        When built, this will update the first table in your Docx Template. The
        final PDF will include this table of contents, and a separate docx file
        of the table will be saved in the same directory as the PDF output.
      </p>
    </div>
  );
}

function PdfTypeHelp() {
  // Updated PdfTypeHelp function with simpler language
  return (
    <div className="help-content">
      <h4>
        <b>PDF Type</b>
      </h4>
      <p>
        A PDF Type defines a group of files based on their filenames. It can
        match several files.
      </p>
      <p>How to use:</p>
      <ul>
        <li>
          To match files containing specific text in their filenames, enter the
          text with or without quotes.
        </li>
        <li>
          For more complex matching, use the <b>and</b>, <b>or</b>, and{' '}
          <b>not</b> keywords along with parentheses. Use quotes around text
          when using keywords.
        </li>
        <li>
          Examples:
          <ul>
            <li>
              <code>"report"</code> or <code>report</code> matches all filenames
              containing "report".
            </li>
            <li>
              <code>"report" and "2020"</code> matches filenames containing both
              "report" and "2020".
            </li>
            <li>
              <code>"report" or "2020"</code> matches filenames containing
              either "report" or "2020".
            </li>
            <li>
              <code>"report" and not "2020"</code> matches filenames containing
              "report" but not "2020".
            </li>
            <li>
              <code>("report" or "2020") and not "2021"</code> matches filenames
              containing "report" or "2020" but not "2021".
            </li>
          </ul>
        </li>
        <li>
          When a PDF Type matches at least one file, it turns green and shows
          the matching files below, sorted alphabetically. If it matches no
          files, it turns red and is ignored when building.
        </li>
      </ul>
      <h5>Bookmark Rules</h5>
      <p>
        Within a PDF Type, you can set page-level bookmark rules. These rules
        check the text on each page to decide whether to add a bookmark. You
        specify rules using the same logic as above (e.g.,{' '}
        <code>"report" and not "form"</code>) and provide a bookmark title for
        matches.
      </p>
      <p>
        Pages with the same bookmark in a row are grouped under a single
        bookmark at the first page of the group.
        <br />
        <b>Note:</b> The matching logic applies to the text within the PDFs, not
        their filenames.
      </p>
      <p>
        Example: <code>"report" and not "form"</code> matches pages containing
        "report" but not "form". These pages get bookmarked with your specified
        title.
      </p>
      <p>
        There's a special bookmark rule for Merit sample IDs. It sets bookmarks
        based on the sample ID on each page. If multiple different IDs are found
        on the same page, none are considered valid. IDs are ignored if they're
        preceded by "Report ID: ".
      </p>
      <h5>Bookmark as File Name</h5>
      <p>
        Clicking "Bookmark Files with Filenames" creates a bookmark for each
        file in the PDF Type, using the filenames (with simple formatting like
        replacing underscores with spaces).
      </p>
      <p>
        <b>Important:</b> This is the same as editing the PDF's bookmark by
        double-clicking it in the PDF Type. If you change the PDF Type, these
        bookmarks will be lost.
      </p>
      <h5>Reorder Pages</h5>
      <p>
        This option rearranges pages within each PDF in the PDF Type. It will
        sort alphabetically based on "Lab Sample ID: ____", breaking ties with
        "Data Set ID: ____". When enabled, pages from different files can become
        interleaved.
      </p>
    </div>
  );
}

function SectionHelp() {
  // Updated SectionHelp function with simpler language
  return (
    <div className="help-content">
      <h4>
        <b>Section</b>
      </h4>
      <p>
        Sections allow you to nest bookmarks and specify files from a
        subdirectory.
      </p>
      <p>How to use:</p>
      <ul>
        <li>
          Each section's base directory is relative to its parent section. The
          top-level section uses an absolute path.
        </li>
        <li>
          If a section doesn't have a bookmark, its files will be bookmarked at
          the same level as the parent.
        </li>
        <li>
          When creating templates for reports, you usually only need to change
          one section's directory to point to the new report's files.
        </li>
      </ul>

      <h5>Method Codes</h5>
      <p>
        Sections can be associated with specific method codes, which determine
        whether the section should be included in a report based on the methods
        used in the analytical report.
      </p>
      <p>How method codes work:</p>
      <ul>
        <li>
          When you assign method codes to a section, that section will only be
          included in the final report if at least one of its method codes
          matches a method code in the analytical report.
        </li>
        <li>
          If a section has no method codes assigned, it will always be included
          in the report.
        </li>
        <li>
          The root-level section is always included regardless of method codes
          and cannot have method codes assigned to it.
        </li>
        <li>
          When creating a report from an analytical PDF, the system extracts
          method codes from the PDF and compares them with the method codes
          assigned to each section.
        </li>
        <li>
          Sections with matching method codes are kept, while sections with
          non-matching method codes are removed from the report.
        </li>
        <li>
          This allows you to create comprehensive templates that automatically
          adapt to different types of reports by including only the relevant
          sections.
        </li>
      </ul>
      <p>
        <b>Example:</b> If you have sections for different analytical methods
        (e.g., "GC-MS", "LC-MS", "ICP-MS"), you can assign the appropriate
        method code to each section. When generating a report from an analytical
        PDF that only uses "GC-MS", only the section with the "GC-MS" method
        code will be included.
      </p>
    </div>
  );
}
