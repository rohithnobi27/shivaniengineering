# Final Inspection Reports — integration notes

New files (nothing existing was rewritten):
- client/src/reportSpecs.js            part specs + deterministic in-tolerance observation generator
- client/src/components/InspectionReport.jsx   one A4-landscape report sheet
- client/src/components/InspectionReports.jsx  page for /reports/:id (loads a saved invoice)
- client/src/reports.css               report-only styles + @media print (A4 landscape)

Existing files, additive lines only:
- client/src/App.jsx        + import InspectionReports; + <Route path="/reports/:id" .../>
- client/src/components/InvoiceView.jsx  + "Inspection Reports" link button in the no-print actions bar

How it syncs: open a saved invoice -> "Inspection Reports" -> one report per invoice
line item, part no / name / D.C. No / date / customer / lot size prefilled from the
saved invoice. Print gives one report per page in A4 landscape; invoice printing is
untouched because report print rules live in reports.css, imported only by the report page.
