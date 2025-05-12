// ✅ csvComparator.js — funcional con CSVs de columnas diferentes, estilo mantenido, campos colapsables mejorados con botones y reset

function getAllHeaders(csvList) {
  const all = new Set();
  csvList.forEach(csv => csv.headers.forEach(h => all.add(h)));
  return Array.from(all).sort();
}

function isLikelyDateField(fieldName) {
  return /date|etd|eta|time/i.test(fieldName);
}

function createCollapsibleGroup(titleText, contentElement, includeButtons = false, fieldChecks = [], thresholds = {}) {
  const group = document.createElement('div');
  group.className = 'filter-collapsible';

  const header = document.createElement('div');
  header.className = 'filter-header';
  header.textContent = titleText;
  header.onclick = () => content.classList.toggle('visible');

  const content = document.createElement('div');
  content.className = 'filter-content visible';
  content.style.maxHeight = '350px';
  content.style.overflowY = 'auto';

  if (includeButtons && fieldChecks.length) {
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.marginBottom = '0.5rem';

    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Select All';
    selectAllBtn.className = 'panel-action-btn';
    selectAllBtn.onclick = () => fieldChecks.forEach(f => {
      f.checkbox.checked = true;
      if (thresholds[f.header]) thresholds[f.header].disabled = false;
    });

    const unselectAllBtn = document.createElement('button');
    unselectAllBtn.textContent = 'Unselect All';
    unselectAllBtn.className = 'panel-action-btn';
    unselectAllBtn.onclick = () => fieldChecks.forEach(f => {
      f.checkbox.checked = false;
      if (thresholds[f.header]) thresholds[f.header].disabled = true;
    });

    btnRow.appendChild(selectAllBtn);
    btnRow.appendChild(unselectAllBtn);
    content.appendChild(btnRow);
  }

  content.appendChild(contentElement);
  group.appendChild(header);
  group.appendChild(content);
  return group;
}

export function initCSVComparator(loadedCSVs, containerId = 'comparisonPanelContainer') {
  const oldPanel = document.getElementById(containerId);
  if (oldPanel) oldPanel.remove();

  const panel = document.createElement('div');
  panel.id = containerId;
  panel.className = 'left-panel';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✖';
  closeBtn.className = 'modal-close-btn';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.onclick = () => panel.remove();
  panel.appendChild(closeBtn);

  const title = document.createElement('h3');
  title.textContent = 'CSV Comparison Setup';
  panel.appendChild(title);

  const allHeaders = getAllHeaders(loadedCSVs);

  // CSV Select
  const csvSelect = document.createElement('select');
  csvSelect.multiple = true;
  csvSelect.size = 4;
  csvSelect.className = 'filter-multiselect';
  loadedCSVs.forEach((csv, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = csv.name;
    opt.selected = true;
    csvSelect.appendChild(opt);
  });
  const csvGroup = createCollapsibleGroup('Select CSVs to compare:', csvSelect);
  panel.appendChild(csvGroup);

  // Key Columns
  const keyBox = document.createElement('div');
  const keyChecks = [];

  allHeaders.forEach(h => {
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

    keyChecks.push({ checkbox, header: h });
    keyBox.appendChild(row);
  });

  const keyGroup = createCollapsibleGroup('Key Columns', keyBox, true, keyChecks);
  panel.appendChild(keyGroup);

  // Fields to Compare
  const fieldBox = document.createElement('div');
  const thresholds = {};
  const fieldChecks = [];

  allHeaders.forEach(h => {
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

  const fieldGroup = createCollapsibleGroup('Fields to Compare', fieldBox, true, fieldChecks, thresholds);
  panel.appendChild(fieldGroup);

  // Sticky footer
  const footer = document.createElement('div');
  footer.style.position = 'sticky';
  footer.style.bottom = '0';
  footer.style.background = '#f9f9f9';
  footer.style.padding = '1rem 0';
  footer.style.marginTop = 'auto';

  const diffCheckbox = document.createElement('input');
  diffCheckbox.type = 'checkbox';
  diffCheckbox.checked = true;
  const diffLabel = document.createElement('label');
  diffLabel.append(diffCheckbox, ' Only show differences');
  diffLabel.style.display = 'block';
  footer.appendChild(diffLabel);

  const compareBtn = document.createElement('button');
  compareBtn.textContent = 'Compare';
  compareBtn.className = 'panel-action-btn compare';
  compareBtn.style.marginTop = '1rem';
  footer.appendChild(compareBtn);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Selection';
resetBtn.className = 'panel-action-btn reset';

  resetBtn.style.marginTop = '0.5rem';
  footer.appendChild(resetBtn);

  panel.appendChild(footer);
  document.body.appendChild(panel);

  resetBtn.onclick = () => {
    csvSelect.selectedIndex = -1;
    keyChecks.forEach(f => f.checkbox.checked = false);
    fieldChecks.forEach(f => {
      f.checkbox.checked = false;
      if (thresholds[f.header]) thresholds[f.header].disabled = true;
    });
  };

  compareBtn.onclick = () => {
    const selectedCSVs = Array.from(csvSelect.selectedOptions).map(opt => loadedCSVs[opt.value]);
    if (selectedCSVs.length < 2) return alert('Select at least 2 CSVs');
    const keys = keyChecks.filter(f => f.checkbox.checked).map(f => f.header);
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
