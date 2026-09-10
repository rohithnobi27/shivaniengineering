const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Parse search like "bar 6" / "BAR item 4" into particulars regex */
function buildItemFilter(itemSearch) {
  if (!itemSearch || !itemSearch.trim()) return null;
  const raw = itemSearch.trim();
  const itemNoMatch = raw.match(/(?:item\s*(?:no\.?)?\s*)?(\d+)\s*$/i);
  const itemNo = itemNoMatch ? itemNoMatch[1] : null;
  const namePart = itemNo
    ? raw.replace(/(?:item\s*(?:no\.?)?\s*)?\d+\s*$/i, '').trim()
    : raw;

  let pattern;
  if (namePart && itemNo) {
    pattern = `${escapeRegex(namePart)}[\\s\\S]*?ITEM\\s*NO\\.?\\s*:?\\s*${escapeRegex(itemNo)}(\\b|$|\\s)`;
  } else if (itemNo) {
    pattern = `ITEM\\s*NO\\.?\\s*:?\\s*${escapeRegex(itemNo)}(\\b|$|\\s)`;
  } else {
    pattern = escapeRegex(raw);
  }

  return {
    items: {
      $elemMatch: { particulars: { $regex: pattern, $options: 'i' } },
    },
  };
}

/** Indian FY prefix e.g. 26-27 (Apr–Mar) */
function fyPrefixForDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan
  const startYear = month >= 3 ? year : year - 1;
  const a = String(startYear).slice(-2);
  const b = String(startYear + 1).slice(-2);
  return `${a}-${b}`;
}

router.get('/next-invoice', async (req, res) => {
  try {
    const prefix = fyPrefixForDate(req.query.date);
    const invoices = await Invoice.find({
      invoiceNo: { $regex: `^${prefix}\\s*/\\s*\\d+`, $options: 'i' },
    })
      .select('invoiceNo')
      .lean();

    let max = 0;
    const re = new RegExp(`^${prefix}\\s*/\\s*(\\d+)`, 'i');
    for (const inv of invoices) {
      const m = String(inv.invoiceNo || '').match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }

    const nextSeq = max > 0 ? max + 1 : 200;
    res.json({
      prefix,
      nextSeq,
      invoiceNo: `${prefix}/${nextSeq}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/next-dc', async (_req, res) => {
  try {
    const invoices = await Invoice.find({ dcNo: { $exists: true, $ne: '' } })
      .select('dcNo')
      .lean();
    let max = 0;
    for (const inv of invoices) {
      const n = parseInt(String(inv.dcNo).replace(/\D/g, ''), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    res.json({ nextDcNo: String(max + 1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { item, from, to } = req.query;
    const filter = {};

    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    const itemFilter = buildItemFilter(item);
    if (itemFilter) Object.assign(filter, itemFilter);

    const invoices = await Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 });

    let totalPieces = 0;
    let totalCost = 0;
    let totalGst = 0;
    let matchedLineQty = 0;

    const itemLower = (item || '').trim().toLowerCase();
    const itemNoMatch = itemLower.match(/(?:item\s*(?:no\.?)?\s*)?(\d+)\s*$/);
    const itemNo = itemNoMatch ? itemNoMatch[1] : null;
    const namePart = itemNo
      ? itemLower.replace(/(?:item\s*(?:no\.?)?\s*)?\d+\s*$/, '').trim()
      : itemLower;

    for (const inv of invoices) {
      let invMatchedQty = 0;
      let invMatchedAmount = 0;
      for (const line of inv.items || []) {
        const p = (line.particulars || '').toLowerCase();
        const matchesItem =
          !itemLower ||
          ((!namePart || p.includes(namePart)) &&
            (!itemNo || new RegExp(`item\\s*no\\.?\\s*:?\\s*${itemNo}(\\b|$|\\s)`, 'i').test(p)));
        if (matchesItem) {
          invMatchedQty += line.quantity || 0;
          invMatchedAmount += line.amount || 0;
        }
        totalPieces += line.quantity || 0;
      }
      matchedLineQty += invMatchedQty;

      const sub = inv.subtotal || 0;
      const gst = inv.igstAmount || 0;
      if (itemLower && sub > 0) {
        totalCost += invMatchedAmount;
        totalGst += (invMatchedAmount / sub) * gst;
      } else if (!itemLower) {
        totalCost += sub;
        totalGst += gst;
      }
    }

    const cost = Math.round(totalCost * 100) / 100;
    const gst = Math.round(totalGst * 100) / 100;

    res.json({
      invoices,
      summary: {
        dcCount: invoices.length,
        totalPieces: itemLower ? matchedLineQty : totalPieces,
        totalCost: cost,
        totalGst: gst,
        grandTotal: Math.round((cost + gst) * 100) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { item, from, to } = req.query;
    const filter = {};

    if (from || to) {
      filter.invoiceDate = {};
      if (from) filter.invoiceDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    const itemFilter = buildItemFilter(item);
    if (itemFilter) Object.assign(filter, itemFilter);

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('items.componentId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/payment-received-between', async (req, res) => {
  try {
    const { from, to, receivedDate } = req.body;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(from || '')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(to || ''))) {
      return res.status(400).json({ error: 'Valid from and to dates are required' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(receivedDate || ''))) {
      return res.status(400).json({ error: 'A payment received date is required' });
    }
    const startOfDay = new Date(`${from}T00:00:00.000`);
    const endOfDay = new Date(`${to}T23:59:59.999`);
    if (startOfDay > endOfDay) return res.status(400).json({ error: 'From date must be before To date' });
    const result = await Invoice.updateMany(
      { invoiceDate: { $gte: startOfDay, $lte: endOfDay } },
      { $set: { paymentReceived: true, paymentReceivedDate: new Date(`${receivedDate}T00:00:00.000`) } }
    );
    res.json({ updated: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
