'use client';

import { useEffect, useState } from 'react';

interface Coffee {
  id: string;
  name: string;
  roastLossPercentage: number;
  active: boolean;
}

interface BlendComponent {
  coffeeId: string;
  percentage: number;
}

interface Blend {
  id: string;
  name: string;
  components: BlendComponent[];
}

interface VariantMapping {
  id: string;
  variantId: string;
  title: string;
  isBlend: boolean;
  coffeeId?: string;
  blendId?: string;
}

export default function SettingsPage() {
  const [coffees, setCoffees] = useState<Coffee[]>([]);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [mappings, setMappings] = useState<VariantMapping[]>([]);
  const [coffeeForm, setCoffeeForm] = useState({ name: '', roastLossPercentage: 15 });
  const [blendForm, setBlendForm] = useState<{ name: string; components: BlendComponent[] }>({
    name: '',
    components: []
  });
  const [mappingForm, setMappingForm] = useState({
    variantId: '',
    title: '',
    isBlend: false,
    coffeeId: '',
    blendId: ''
  });

  const load = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setCoffees(data.coffees || []);
    setBlends(data.blends || []);
    setMappings(data.mappings || []);
  };

  useEffect(() => {
    load();
  }, []);

  const saveCoffee = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'coffee', payload: coffeeForm })
    });
    setCoffeeForm({ name: '', roastLossPercentage: 15 });
    load();
  };

  const saveBlend = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'blend', payload: blendForm })
    });
    setBlendForm({ name: '', components: [] });
    load();
  };

  const saveMapping = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mapping', payload: mappingForm })
    });
    setMappingForm({ variantId: '', title: '', isBlend: false, coffeeId: '', blendId: '' });
    load();
  };

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="panel">
        <div className="pill">Settings</div>
        <h2 style={{ marginTop: 8 }}>Coffees, blends, and variant mappings</h2>
      </div>

      <div className="panel">
        <h3>Coffees</h3>
        <div className="grid" style={{ gap: 8 }}>
          <div className="stack-row" style={{ flexWrap: 'wrap' }}>
            <input
              placeholder="Name"
              value={coffeeForm.name}
              onChange={(e) => setCoffeeForm({ ...coffeeForm, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Roast loss %"
              value={coffeeForm.roastLossPercentage}
              onChange={(e) =>
                setCoffeeForm({ ...coffeeForm, roastLossPercentage: Number(e.target.value) })
              }
            />
            <button className="btn secondary" onClick={saveCoffee}>
              Add coffee
            </button>
          </div>
          <div className="card-stack">
            {coffees.map((coffee) => (
              <div key={coffee.id} className="panel" style={{ padding: 10 }}>
                <strong>{coffee.name}</strong> · roast loss {coffee.roastLossPercentage}%
              </div>
            ))}
            {!coffees.length && <div className="muted">No coffees yet.</div>}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Blends</h3>
        <div className="grid" style={{ gap: 8 }}>
          <div className="stack-row" style={{ flexWrap: 'wrap' }}>
            <input
              placeholder="Blend name"
              value={blendForm.name}
              onChange={(e) => setBlendForm({ ...blendForm, name: e.target.value })}
            />
            <button
              className="btn secondary"
              onClick={() =>
                setBlendForm({
                  ...blendForm,
                  components: [...blendForm.components, { coffeeId: '', percentage: 0 }]
                })
              }
            >
              + Component
            </button>
            <button className="btn secondary" onClick={saveBlend}>
              Save blend
            </button>
          </div>
          {blendForm.components.map((comp, idx) => (
            <div key={idx} className="stack-row" style={{ flexWrap: 'wrap' }}>
              <select
                value={comp.coffeeId}
                onChange={(e) => {
                  const components = [...blendForm.components];
                  components[idx] = { ...components[idx], coffeeId: e.target.value };
                  setBlendForm({ ...blendForm, components });
                }}
              >
                <option value="">Coffee</option>
                {coffees.map((coffee) => (
                  <option key={coffee.id} value={coffee.id}>
                    {coffee.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="%"
                value={comp.percentage}
                onChange={(e) => {
                  const components = [...blendForm.components];
                  components[idx] = { ...components[idx], percentage: Number(e.target.value) };
                  setBlendForm({ ...blendForm, components });
                }}
              />
            </div>
          ))}
          <div className="card-stack">
            {blends.map((blend) => (
              <div key={blend.id} className="panel" style={{ padding: 10 }}>
                <strong>{blend.name}</strong>
                <div className="muted">
                  {blend.components.map((c) => `${c.coffeeId} ${c.percentage}%`).join(' · ')}
                </div>
              </div>
            ))}
            {!blends.length && <div className="muted">No blends yet.</div>}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Variant → coffee mapping</h3>
        <div className="stack-row" style={{ flexWrap: 'wrap' }}>
          <input
            placeholder="Shopify variant ID"
            value={mappingForm.variantId}
            onChange={(e) => setMappingForm({ ...mappingForm, variantId: e.target.value })}
          />
          <input
            placeholder="Display title"
            value={mappingForm.title}
            onChange={(e) => setMappingForm({ ...mappingForm, title: e.target.value })}
          />
          <select
            value={mappingForm.isBlend ? 'blend' : 'coffee'}
            onChange={(e) => setMappingForm({ ...mappingForm, isBlend: e.target.value === 'blend' })}
          >
            <option value="coffee">Coffee</option>
            <option value="blend">Blend</option>
          </select>
          <select
            value={mappingForm.isBlend ? mappingForm.blendId : mappingForm.coffeeId}
            onChange={(e) =>
              mappingForm.isBlend
                ? setMappingForm({ ...mappingForm, blendId: e.target.value })
                : setMappingForm({ ...mappingForm, coffeeId: e.target.value })
            }
          >
            <option value="">Target</option>
            {(mappingForm.isBlend ? blends : coffees).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <button className="btn secondary" onClick={saveMapping}>
            Save mapping
          </button>
        </div>

        <div className="card-stack" style={{ marginTop: 10 }}>
          {mappings.map((m) => (
            <div key={m.id} className="panel" style={{ padding: 10 }}>
              <strong>{m.title || m.variantId}</strong> → {m.isBlend ? `Blend ${m.blendId}` : `Coffee ${m.coffeeId}`}
            </div>
          ))}
          {!mappings.length && <div className="muted">No mappings defined.</div>}
        </div>
      </div>
    </div>
  );
}
