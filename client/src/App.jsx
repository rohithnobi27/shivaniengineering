import { Routes, Route, NavLink } from 'react-router-dom';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import InvoiceView from './components/InvoiceView';
import InspectionReports from './components/InspectionReports';
import PaymentTracking from './components/PaymentTracking';

export default function App() {
  return (
    <div className="app">
      <header className="navbar no-print">
        <h1>Shivani Engineering — DC Manager</h1>
        <nav>
          <NavLink to="/" end>New DC</NavLink>
          <NavLink to="/invoices">Saved Invoices</NavLink>
          <NavLink to="/payments">Payment Tracking</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<InvoiceForm />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoice/:id" element={<InvoiceView />} />
        <Route path="/reports/:id" element={<InspectionReports />} />
        <Route path="/payments" element={<PaymentTracking />} />
      </Routes>
    </div>
  );
}
