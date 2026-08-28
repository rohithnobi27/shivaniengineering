const express = require('express');
const router = express.Router();
const Component = require('../models/Component');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) {
      filter.category = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: new RegExp(safe, 'i') },
        { particulars: new RegExp(safe, 'i') },
        { category: new RegExp(safe, 'i') },
        { itemNo: new RegExp(safe, 'i') },
      ];
    }

    const components = await Component.find(filter).sort({ category: 1, itemNo: 1 });
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const categories = await Component.distinct('category');
    res.json(categories.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) return res.status(404).json({ error: 'Component not found' });
    res.json(component);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const component = await Component.create(req.body);
    res.status(201).json(component);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
