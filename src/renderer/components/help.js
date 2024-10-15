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
      <Tabs defaultActiveKey="docxTemplate" id="help-tabs" className="mb-3">
        <Tab eventKey="docxTemplate" title="Docx Template">
          <DocxTemplateHelp />
        </Tab>
        <Tab eventKey="pdfType" title="PDF Type">
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
  return (
    <div className="help-content">
      <h4>
        <b>Docx Template</b>
      </h4>
      <p>
        Docx templates are useful for making pages that have text that varies
        between reports. They are also used to create a table of contents.
      </p>
      <h5>Text Replacement</h5>
      <ol>
        <li>
          In the Word document, use this notation to flag a variable to be
          replaced:{' '}
          <code>
            {'${'}variable_name{'}'}
          </code>
          .
        </li>
        <li>
          Then when you add the file to PDFBuilder, <code>variable_name</code>{' '}
          will show as a field where you can specify the value for the current
          report.
        </li>
        <li>
          When the report is built,{' '}
          <code>
            {'${'}variable_name{'}'}
          </code>{' '}
          is replaced with the text you specified.
        </li>
      </ol>
      <h5>Table of Contents</h5>
      <p>
        PDFBuilder supports the creation of a table of contents from the
        bookmarks you create.
      </p>
      <ol>
        <li>
          Enable <code>Has Table of Contents</code> in the Docx Template
          settings.
        </li>
        <li>
          Enter the start and end page column numbers. The far left column is 1.
          The page start column is required, but the page end column is
          optional.
        </li>
        <li>
          Set the <code>Page Number Offset</code> to the number of pages that
          will precede the first page of the report. This number will be added
          to each page number in the table of contents.
        </li>
      </ol>
      <p>
        When built, this will work by editing the first table in the specified
        Docx Template. The resulting PDF report will include this table of
        contents. It will also be output to a separate docx file in the same
        directory as the PDF output.
      </p>
    </div>
  );
}

function PdfTypeHelp() {
  return (
    <div className="help-content">
      <h4>
        <b>PDF Type</b>
      </h4>
      <p>
        A PDF type is specified by the content of file names. Several files may
        be found from one PDF Type.
      </p>
      <p>How to use:</p>
      <ul>
        <li>
          To match a file that contains a certain text in its filename, enter
          the text with or without quotes.
        </li>
        <li>
          For more complex matching, you can use the <b>and</b>, <b>or</b> and{' '}
          <b>not</b> keywords and parentheses. Quotes must be around text to
          match when using keywords.
        </li>
        <li>
          Examples:
          <ul>
            <li>
              <code>"report"</code>/<code>report</code> match all filenames
              containing the word "report"
            </li>
            <li>
              <code>"report" and "2020"</code> matches all filenames containing
              both "report" and "2020"
            </li>
            <li>
              <code>"report" or "2020"</code> matches all filenames containing
              either "report" or "2020"
            </li>
            <li>
              <code>"report" and not "2020"</code> matches all filenames
              containing "report" but not "2020"
            </li>
            <li>
              <code>("report" or "2020") and not "2021"</code> matches all
              filenames containing either "report" or "2020" but not "2021"
            </li>
          </ul>
        </li>
        <li>
          When a PDF Type matches at least one file, it will turn green and
          display the matching files below sorted alphabetically. PDF Types are
          allowed to have zero matches in which case they will be red and
          ignored when building.
        </li>
      </ul>
      <h5>Bookmark Rules</h5>
      <p>
        Within a PDF Type, you may configure page-level bookmarking rules. These
        rules will examine the text of a page and determine what bookmark, if
        any, should be applied to that page. You must specify rules using the
        same logic as described above (e.g.
        <code>"report" and not "form"</code>), as well as a bookmark title for
        when a match is found. When several consecutive pages have the same
        bookmark, they will be grouped into a single bookmark on the first page
        of the group.{' '}
        <b>
          Again, the matching logic will apply to the text in the PDFs rather
          than the filename.
        </b>
        <br />
        <br />
        Example: <code>"report" and not "form"</code> will match all pages
        containing the word "report" but not "form". These pages will be
        bookmarked with your specified bookmark title.
      </p>
      <p>
        There is a special bookmark rule for Merit sample IDs. This can be used
        to set bookmarks based on the sample ID on each page. When multiple
        different IDs are found on the same page, none are considered valid. IDs
        are ignored when they are preceded by "Report ID: "
      </p>
      <h5>Bookmark as File Name</h5>
      <p>
        The button "Bookmark Files with Filenames" will create a bookmark for
        each file in the PDF Type. This also applies simple formatting such as
        replacing underscores with spaces.
      </p>
      <p>
        <b>Important:</b> This is equivalent to editing via double-clicking the
        PDF's bookmark in the PDF Type. If the PDF Type is changed, the bookmark
        file names will be lost.
      </p>
      <h5>Reorder Pages</h5>
      <p>
        This option was created to solve the ordering of Metals Form 1. When
        enabled, the pages of every PDF in the PDF Type will be reordered based
        on the "Lab Sample ID: ____", breaking ties with the "Data Set ID:
        ____". Files can end up interwoven when this is enabled.
      </p>
    </div>
  );
}

function SectionHelp() {
  return (
    <div className="help-content">
      <h4>
        <b>Section</b>
      </h4>
      <p>
        Sections are used to nest bookmarks and/or specify files from a nested
        directory.
      </p>
      <p>How to use:</p>
      <ul>
        <li>
          Each section's base directory is relative to its parent section except
          for the top-level section which uses an absolute path.
        </li>
        <li>
          When a section does not have a bookmark, the files inside will be
          bookmarked on the same level as the parent.
        </li>
        <li>
          When a template is created for a report, only one section's directory
          should need to be changed for the template to point at the new
          report's files.
        </li>
      </ul>
    </div>
  );
}
