require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const componentRoutes = require('./routes/components');
const invoiceRoutes = require('./routes/invoices');
const defaultComponents = require('./defaultComponents');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/components', componentRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    return Promise.all(
      defaultComponents.map((component) =>
        require('./models/Component').updateOne(
          { itemNo: component.itemNo },
          { $setOnInsert: component },
          { upsert: true }
        )
      )
    );
  })
  .then(() => {
    console.log('Default invoice components available');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
