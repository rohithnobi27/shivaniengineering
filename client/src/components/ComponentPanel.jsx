import { useEffect, useState } from 'react';
import { fetchCategories, fetchComponents } from '../api';

export default function ComponentPanel({ onAddItem, selectedIds }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;

    fetchComponents(params)
      .then(setComponents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const handleCategoryClick = (cat) => {
    setActiveCategory((prev) => (prev === cat ? '' : cat));
    setSearch('');
  };

  const handleAdd = (component) => {
    onAddItem(component, Number(qty) || 1);
  };

  return (
    <div className="panel no-print">
      <div className="panel-header">Components</div>
      <div className="panel-body">
        <input
          className="search-input"
          type="text"
          placeholder="Search e.g. BAR 32x48, BOSS..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setActiveCategory('');
          }}
        />

        <div className="category-list">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading...</p>
        ) : components.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No components found</p>
        ) : (
          <div className="component-list">
            {components.map((comp) => (
              <div
                key={comp._id}
                className={`component-item ${selectedIds.includes(comp._id) ? 'selected' : ''}`}
              >
                <h4>{comp.name}</h4>
                <p>{comp.particulars}</p>
                <p>HSN: {comp.hsnCode} | Item No: {comp.itemNo}</p>
                <p className="rate">Rate: ₹ {comp.unitRate.toFixed(2)}</p>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    style={{ width: '70px', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button type="button" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleAdd(comp)}>
                    Add to DC
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
