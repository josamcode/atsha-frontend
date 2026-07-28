import React from 'react';

/**
 * Inspector form primitives.
 *
 * Deliberately small and uncontrolled-friendly: every control is a plain label +
 * input pair so the whole inspector stays keyboard reachable and screen-reader
 * friendly without any custom widget behaviour to get wrong.
 */

let idCounter = 0;
const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

const Field = ({ label, hint, children, htmlFor }) => (
  <div className="tb-field">
    {label && <label className="tb-field__label" htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && <div className="tb-palette__hint">{hint}</div>}
  </div>
);

const TextInput = ({ label, value, onChange, placeholder, dir, hint, type = 'text' }) => {
  const id = React.useMemo(() => nextId('tb-text'), []);
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        className="tb-input"
        type={type}
        dir={dir}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
};

const TextArea = ({ label, value, onChange, rows = 3, dir, hint }) => {
  const id = React.useMemo(() => nextId('tb-area'), []);
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        className="tb-textarea"
        rows={rows}
        dir={dir}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
};

const NumberInput = ({ label, value, onChange, min, max, step = 1, hint, suffix }) => {
  const id = React.useMemo(() => nextId('tb-num'), []);
  return (
    <Field label={suffix ? `${label} (${suffix})` : label} hint={hint} htmlFor={id}>
      <input
        id={id}
        className="tb-input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          onChange(Number(raw));
        }}
      />
    </Field>
  );
};

const SelectInput = ({ label, value, onChange, options, hint }) => {
  const id = React.useMemo(() => nextId('tb-select'), []);
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select
        id={id}
        className="tb-select"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
};

/** Colour control that survives non-hex stored values (rgba, empty, named). */
const ColorInput = ({ label, value, onChange, allowEmpty = true, hint }) => {
  const id = React.useMemo(() => nextId('tb-color'), []);
  const isHex = typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="tb-color">
        <input
          id={id}
          type="color"
          value={isHex ? value : '#ffffff'}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} — swatch`}
        />
        <input
          className="tb-input"
          type="text"
          value={value ?? ''}
          placeholder={allowEmpty ? 'auto' : '#000000'}
          aria-label={`${label} — value`}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field>
  );
};

const Toggle = ({ label, checked, onChange, hint, disabled }) => (
  <label className="tb-toggle">
    <span>
      {label}
      {hint && <div className="tb-palette__hint">{hint}</div>}
    </span>
    <input
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
  </label>
);

const Group = ({ title, children, action }) => (
  <section className="tb-group">
    <div className="tb-group__title">
      <span className="tb-eyebrow">{title}</span>
      {action}
    </div>
    {children}
  </section>
);

const Row = ({ children, columns = 2 }) => (
  <div className={`tb-row${columns === 3 ? ' tb-row--3' : ''}${columns === 4 ? ' tb-row--4' : ''}`}>
    {children}
  </div>
);

export { Field, TextInput, TextArea, NumberInput, SelectInput, ColorInput, Toggle, Group, Row };
