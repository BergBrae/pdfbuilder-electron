# TODO

- Write validate_table_entries()
- Fix table entries build in ICF report

## Issues

- Two table entries cannot have the same name.
- Debug and fix Patrick's ICF tepmplate. Builds fine when there are no table entries, but fails when there are.
- When loading template that has SAMPLEID special rule, it does not show as the special rule.


### Commits to do from meeting on 9/19

[Meeting Notes](https://docs.google.com/document/d/1KNUOfTx2cZitwFIFhohV-zp3E4agBitj4SXuCxOgKug/edit?pli=1 "Google Docs")

- Update merit ID special bookmark rule.
  - “########.d" bookmark as " S#####.##**.
  - not "Report Id: S#####.##".
- Allow PDF to build when a section's base directory is not present.
  - e.g. There is no PFAS folder but there is a PFAS section.
- Build table of contents from the outline.
  - i.e. when a section does not exist it should not be in the table of contents.
- Rearrange metals form 1 by sort(SampleID, file).
  - Meaning the files will be interwoven, where each change in sample ID is a breakable point.
- Update Help Section
