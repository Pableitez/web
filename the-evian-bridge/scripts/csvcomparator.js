// ✅ csvComparator.js — totalmente funcional, con umbrales individuales por campo de fecha

function getCommonHeaders(csvList) {
  if (!csvList.length) return [];
  return [...csvList.map(csv => new Set(csv.headers))
    .reduce((a, b) => new Set([...a].filter(x => b.has(x))))];
}

function isLikelyDateField(fieldName) {
  return /date|etd|eta|time/i.test(fieldName);
}

export function initCSVComparator(loadedCSVs, containerId = 'comparisonPanelContainer') {
  const oldPanel = document.getElementById(containerId);
  if (oldPanel) oldPanel.remove();

  const panel = document.createElement('div');
  panel.id = containerId;
  panel.className = 'left-panel';
  panel.style.cssText = `width: 360px; background: #fff; border-right: 1px solid #ccc; padding: 1rem;
    overflow-y: auto; position: absolute; top: 0; bottom: 0; left: 0; z-index: 10;`;

  // Botón de cierre
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✖';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => panel.remove();
  panel.appendChild(closeBtn);

  const title = document.createElement('h3');
  title.textContent = 'CSV Comparison Setup';
  panel.appendChild(title);

  const commonHeaders = getCommonHeaders(loadedCSVs);

  // Selección de archivos mejorada
// === Selección de archivos mejorada con estilo ===
const csvSelectWrapper = document.createElement('div');
csvSelectWrapper.className = 'filter-block';

const csvSelectLabel = document.createElement('label');
csvSelectLabel.textContent = 'Select CSVs to compare:';
csvSelectLabel.className = 'field-label';

const csvSelect = document.createElement('select');
csvSelect.multiple = true;
csvSelect.size = 4;
csvSelect.className = 'field-multiselect';

loadedCSVs.forEach((csv, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = csv.name;
  opt.selected = true;
  csvSelect.appendChild(opt);
});

csvSelectWrapper.appendChild(csvSelectLabel);
csvSelectWrapper.appendChild(csvSelect);
panel.appendChild(csvSelectWrapper);

// === Key Columns (también con estilo coherente) ===
// === Key Columns con checkboxes estilizados ===
const keyWrapper = document.createElement('div');
keyWrapper.className = 'filter-block';

const keyLabel = document.createElement('label');
keyLabel.textContent = 'Key Columns';
keyLabel.className = 'field-label';
keyWrapper.appendChild(keyLabel);

const keyBox = document.createElement('div');
keyBox.className = 'fields-grid';

const keyChecks = [];

commonHeaders.forEach(h => {
  const row = document.createElement('div');
  row.className = 'field-row';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = h;
  checkbox.checked = false;

  const label = document.createElement('label');
  label.className = 'field-label';
  label.textContent = h;

  const wrapper = document.createElement('label');
  wrapper.className = 'field-wrapper';
  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);

  row.appendChild(wrapper);
  keyBox.appendChild(row);

  keyChecks.push(checkbox);
});

keyWrapper.appendChild(keyBox);
panel.appendChild(keyWrapper);

// === Helper: getSelected keys ===
const keySelect = {
  getSelected: () => keyChecks.filter(cb => cb.checked).map(cb => cb.value),
  setSelected: values => keyChecks.forEach(cb => cb.checked = values.includes(cb.value)),
};



  // Campos y umbrales
  const fieldSection = document.createElement('div');
  fieldSection.innerHTML = `<label>Fields to Compare</label>`;
const fieldBox = document.createElement('div');
fieldBox.style.maxHeight = '400px'; // puedes ajustar esta altura
fieldBox.style.overflowY = 'auto';
fieldBox.style.paddingRight = '6px'; // opcional, para evitar que tape el scroll

  const thresholds = {}; // clave -> umbral en días

  const selectAllBtn = document.createElement('button');
  selectAllBtn.textContent = 'Select All';
  selectAllBtn.className = 'panel-action-btn';
  const unselectAllBtn = document.createElement('button');
  unselectAllBtn.textContent = 'Unselect All';
  unselectAllBtn.className = 'panel-action-btn';

  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.marginBottom = '0.5rem';
  btnRow.appendChild(selectAllBtn);
  btnRow.appendChild(unselectAllBtn);

  fieldSection.appendChild(btnRow);

  const fieldChecks = [];

  commonHeaders.forEach(h => {
    const row = document.createElement('div');
    row.className = 'field-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = h;
    checkbox.checked = false;

    const label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = h;

    const wrapper = document.createElement('label');
    wrapper.className = 'field-wrapper';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    row.appendChild(wrapper);

    if (isLikelyDateField(h)) {
      const thresh = document.createElement('input');
      thresh.className = 'field-threshold';
      thresh.type = 'number';
      thresh.placeholder = 'days';
      thresh.disabled = true;
      thresholds[h] = thresh;

      row.appendChild(thresh);

      checkbox.addEventListener('change', () => {
        thresh.disabled = !checkbox.checked;
      });
    }

    fieldChecks.push({ checkbox, header: h });
    fieldBox.appendChild(row);
  });

  selectAllBtn.onclick = () => fieldChecks.forEach(f => {
    f.checkbox.checked = true;
    if (thresholds[f.header]) thresholds[f.header].disabled = false;
  });

  unselectAllBtn.onclick = () => fieldChecks.forEach(f => {
    f.checkbox.checked = false;
    if (thresholds[f.header]) thresholds[f.header].disabled = true;
  });

  fieldSection.appendChild(fieldBox);
  panel.appendChild(fieldSection);

  const diffCheckbox = document.createElement('input');
  diffCheckbox.type = 'checkbox';
  diffCheckbox.checked = true;
  const diffLabel = document.createElement('label');
  diffLabel.append(diffCheckbox, ' Only show differences');
  diffLabel.style.display = 'block';
  panel.appendChild(diffLabel);

  // Botón comparar
  const compareBtn = document.createElement('button');
  compareBtn.textContent = 'Compare';
  compareBtn.className = 'panel-action-btn';
  compareBtn.style.marginTop = '1rem';
  panel.appendChild(compareBtn);

  document.body.appendChild(panel);

  compareBtn.onclick = () => {
    const selectedCSVs = Array.from(csvSelect.selectedOptions).map(opt => loadedCSVs[opt.value]);
    if (selectedCSVs.length < 2) return alert('Select at least 2 CSVs');
    const keys = keySelect.getSelected();
    const fields = fieldChecks.filter(f => f.checkbox.checked).map(f => f.header);
    if (!keys.length || !fields.length) return alert('Please select keys and fields to compare.');

    const dateThresholds = {};
    Object.entries(thresholds).forEach(([field, input]) => {
      if (!input.disabled) dateThresholds[field] = parseInt(input.value || '0', 10);
    });

    const data = runComparisonMultiple(selectedCSVs, {
      keys, fields,
      onlyDiffs: diffCheckbox.checked,
      dateThresholds
    });

    renderComparisonResults(data);
  };
}



function runComparisonMultiple(csvList, { keys, fields, onlyDiffs, dateThresholds = {} }) {
  const buildKey = row => keys.map(k => (row[k] || '').trim()).join('|');

  const maps = csvList.map(csv => {
    const map = {};
    csv.data.forEach(row => {
      const k = buildKey(row);
      if (k) map[k] = row;
    });
    return map;
  });

  const allKeys = new Set();
  maps.forEach(map => Object.keys(map).forEach(k => allKeys.add(k)));

  const results = [];

  for (let key of allKeys) {
    const row = {};
    const keyParts = key.split('|');
    keys.forEach((k, i) => row[k] = keyParts[i]);

    let different = false;

    fields.forEach(f => {
      const values = maps.map(m => m[key]?.[f] ?? '—');
      const allSame = values.every(v => v === values[0]);
      const isDate = dateThresholds.hasOwnProperty(f);

if (isDate) {
  const timestamps = values.map(v => {
    const d = parseFlexibleDate(v);
    return d ? d.getTime() : NaN;
  }).filter(t => !isNaN(t));

  if (timestamps.length >= 2) {
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const absDiffDays = Math.abs(max - min) / (1000 * 60 * 60 * 24);
    if (absDiffDays > dateThresholds[f]) different = true;
  }
      } else if (!allSame) {
        different = true;
      }

      values.forEach((v, i) => row[`${f}_File${i + 1}`] = v);
    });

    if (!onlyDiffs || different) results.push(row);
  }

  return results;
}

function renderComparisonResults(data) {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '';
  if (!data.length) return (container.innerHTML = '<p>No differences found.</p>');

  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  Object.keys(data[0]).forEach(k => {
    const th = document.createElement('th');
    th.textContent = k;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function createMultiSelect(labelText, options) {
  const container = document.createElement('div');
  container.className = 'comparison-section';

  const label = document.createElement('label');
  label.textContent = labelText;
  label.style.display = 'block';
  label.style.fontWeight = 'bold';
  label.style.marginBottom = '0.5rem';
  container.appendChild(label);

  const grid = document.createElement('div');
  grid.className = 'fields-grid';

  const selects = [];

  options.forEach((opt, i) => {
    const box = document.createElement('label');
    box.className = 'field-wrapper'; // Igual que en fields to compare

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = opt;
    checkbox.className = 'field-checkbox';

    const span = document.createElement('span');
    span.textContent = opt;
    span.className = 'field-label';

    box.appendChild(checkbox);
    box.appendChild(span);
    grid.appendChild(box);

    selects.push(checkbox);
  });

  container.appendChild(grid);

  return {
    container,
    getSelected: () =>
      selects.filter(cb => cb.checked).map(cb => cb.value),
    setSelected: values =>
      selects.forEach(cb => (cb.checked = values.includes(cb.value)))
  };
}


function parseFlexibleDate(value) {
  if (!value || typeof value !== "string") return null;

  // dd/mm/yyyy o dd-mm-yyyy con hora opcional
  const match = value.match(
    /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (match) {
    const [, day, month, year, hours = "00", minutes = "00", seconds = "00"] = match;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
  }

  const parsed = Date.parse(value);
  return isNaN(parsed) ? null : new Date(parsed);
}
