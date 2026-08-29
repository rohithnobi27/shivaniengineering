import { observationFor } from '../reportSpecs';

const APPEARANCE_ROWS = [
  { no: '1', label: 'Loose Burr', standard: 'Not Allowed', method: 'Visual' },
  { no: '2', label: 'Damages', standard: 'Not Allowed', method: 'Visual' },
];

/**
 * One A4-landscape Final Inspection Report sheet.
 *
 * props:
 *  report = { key, partName, partNo, spec, quantity }
 *  meta   = { customer, dcNo, date, lotSize, sampleSize, issueNo }
 *  observations = number of ACTUAL OBSERVATION columns (1..10)
 */
export default function InspectionReport({ report, meta, observations = 10 }) {
  const spec = report.spec || {};
  const dimRows = [
    { no: '1', label: 'Total Length', standard: spec.totalLength, method: 'Vernier' },
    { no: '2', label: 'Inner Dia', standard: spec.innerDia, method: 'Vernier' },
    { no: '3', label: 'Outer Dia', standard: spec.outerDia, method: 'Vernier' },
    { no: '4', label: 'OD Chamfer', standard: spec.odChamfer, method: 'Visual' },
    { no: '5', label: 'ID Chamfer', standard: spec.idChamfer, method: 'Visual' },
    { no: '6', label: 'Tapping', standard: spec.tapping, method: 'Gauge' },
  ];
  const count = Math.max(1, Math.min(10, Number(observations) || 10));
  const cols = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <section className="report-sheet">
      <header className="report-head">
        <h2>SHIVANI ENGINEERING</h2>
        <p>FINAL INSPECTION REPORT</p>
      </header>

      <table className="report-meta-table">
        <tbody>
          <tr>
            <td>CUSTOMER : {meta.customer || '-'}</td>
            <td>PART NO: {report.partNo || '-'}</td>
            <td>PART NAME: {report.partName}</td>
            <td>ISSUE NO.: {meta.issueNo || '-'}</td>
          </tr>
          <tr>
            <td>D.C. No: {meta.dcNo || '-'}</td>
            <td>DATE : {meta.date || '-'}</td>
            <td>LOT SIZE: {meta.lotSize || `${report.quantity} No's`}</td>
            <td>SAMPLE SIZE.: {meta.sampleSize || `${count} No's`}</td>
          </tr>
        </tbody>
      </table>

      <table className="report-table">
        <thead>
          <tr>
            <th rowSpan={2} className="c-sl">Sl. No.</th>
            <th rowSpan={2} className="c-param">PARAMETER</th>
            <th rowSpan={2} className="c-uom">UOM</th>
            <th rowSpan={2} className="c-spl">SPL. CHAR.</th>
            <th rowSpan={2} className="c-std">Acceptance Standard</th>
            <th rowSpan={2} className="c-method">Inspection Method</th>
            <th colSpan={cols.length}>ACTUAL OBSERVATION</th>
            <th rowSpan={2} className="c-remarks">REMARKS</th>
          </tr>
          <tr>
            {cols.map((c) => (
              <th key={c} className="c-obs">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="center">I</td>
            <td colSpan={5 + cols.length + 1} className="section-label">APPEARANCE INSPECTION</td>
          </tr>
          {APPEARANCE_ROWS.map((r) => (
            <tr key={r.label}>
              <td className="center">{r.no}</td>
              <td>{r.label}</td>
              <td />
              <td />
              <td>{r.standard}</td>
              <td>{r.method}</td>
              {cols.map((c) => (
                <td key={c} className="center">OK</td>
              ))}
              <td className="center">Accepted</td>
            </tr>
          ))}

          <tr>
            <td className="center">II</td>
            <td colSpan={5 + cols.length + 1} className="section-label">DIMENSIONAL INSPECTION</td>
          </tr>
          {dimRows.map((r) => (
            <tr key={r.label}>
              <td className="center">{r.no}</td>
              <td>{r.label}</td>
              <td className="center">{r.standard ? 'mm' : ''}</td>
              <td />
              <td>{r.standard || ''}</td>
              <td>{r.standard ? r.method : ''}</td>
              {cols.map((c) => (
                <td key={c} className="center">
                  {r.standard ? observationFor(r.standard, `${report.key}-${r.label}-${c}`) : ''}
                </td>
              ))}
              <td className="center">{r.standard ? 'Accepted' : ''}</td>
            </tr>
          ))}

          {[0, 1, 2].map((i) => (
            <tr key={`blank-${i}`}>
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
              {cols.map((c) => (
                <td key={c} />
              ))}
              <td />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="report-signs">
        <span>Inspected By: ____________________</span>
        <span>Approved By: ____________________</span>
      </div>
    </section>
  );
}
