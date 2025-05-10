      // 📦 IndexedDB setup
      let db;
      let loadedCSVs = [];
      const DB_NAME = 'embarquesDB';
      const STORE_NAME = 'csvVersions';

      function initDB() {

        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = function (event) {
          db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = function (event) {
          db = event.target.result;
          console.log('IndexedDB listo');
        };

        request.onerror = function (event) {
          console.error('Error con IndexedDB:', event.target.errorCode);
        };
      }

      // 🚀 App initialization
      document.addEventListener("DOMContentLoaded", function () {
        initDB();
        let originalData = [];
        let filteredData = [];
        let currentPage = 1;
        const filterValues = {};
        let currentHeaders = [];
       

        document.getElementById("csvFileInput").addEventListener("change", function (e) {
          const file = e.target.files[0];
          if (!file) return;

          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
              originalData = results.data;
              filteredData = [...originalData];
              currentHeaders = Object.keys(originalData[0]);
              generateFilterSidebar(currentHeaders); 
              generateColumnVisibilityControls(currentHeaders);
              applyFilters();
              populateSavedViews();
              populateFilterViews();

              const toggleHeader = document.getElementById("toggleSavedFilters");
      if (toggleHeader) {
        toggleHeader.addEventListener("click", () => {
          const container = document.getElementById("savedFiltersContainer");
          const icon = toggleHeader.querySelector(".toggle-icon");
          container.classList.toggle("visible");
          icon.textContent = container.classList.contains("visible") ? "▲" : "▼";
        });
      }



              
              const globalInput = document.getElementById("globalSearchInput");
              if (globalInput) {
                globalInput.addEventListener("input", () => {
                  applyFilters();
                });
              }

              document.addEventListener("input", (e) => {
                const input = e.target;
                if (!input.closest(".filter-block")) return;
              
                const block = input.closest(".filter-block");
                const inputs = block.querySelectorAll("input[type='text'], input[type='date']");
                const hasValue = Array.from(inputs).some(i => i.value.trim() !== "");
              
                block.classList.toggle("active", hasValue);
              });
            },
          });

      // 🔁 Manejador para múltiples CSV
      document.getElementById("csvMultiInput").addEventListener("change", function (e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        loadedCSVs.length = 0;

        let filesProcessed = 0;

        files.forEach(file => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
              loadedCSVs.push({
                name: file.name,
                data: results.data,
                headers: Object.keys(results.data[0] || {})
              });

              filesProcessed++;
              if (filesProcessed === files.length) {
                console.log("📂 Archivos cargados:", loadedCSVs);
                alert(`✅ Se cargaron ${files.length} archivo(s). Listos para comparar.`);


              }
            }
          });
        });
      });

      // ✅ AÑADIMOS ESTE EVENTO para que el botón funcione correctamente
      const setupBtn = document.getElementById("setupComparisonBtn");
      if (setupBtn) {
        setupBtn.addEventListener("click", function () {
          showComparisonSetup();
        });
      }
  });

// 🔁 Encuentra columnas comunes entre los CSVs
function getCommonHeaders(csvList) {
  if (csvList.length === 0) return [];
  return csvList.map(c => c.headers).reduce((a, b) => a.filter(x => b.includes(x)));
}

// 🎛️ Panel de configuración para comparación avanzada
function showComparisonSetup() {
  if (loadedCSVs.length < 2) {
    alert("Load at least 2 CSV files to compare.");
    return;
  }

  // Modal base
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "comparisonPanel";

  const content = document.createElement("div");
  content.className = "modal-content";

  // Título
  const title = document.createElement("h3");
  title.textContent = "Comparison Setup";
  title.classList.add("modal-title");
  content.appendChild(title);

  // === Sección: CSV Files ===
  const csvSection = document.createElement("div");
  csvSection.className = "comparison-section";
  const csvLabel = document.createElement("label");
  csvLabel.innerHTML = "<strong>Select CSV Files to Compare</strong>";
  const csvSelect = document.createElement("select");
  csvSelect.id = "csvFilesSelect";
  csvSelect.multiple = true;
  csvSelect.size = 4;

  loadedCSVs.forEach((csv, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.selected = true;
    option.textContent = csv.name;
    csvSelect.appendChild(option);
  });

  csvSection.append(csvLabel, csvSelect);
  content.appendChild(csvSection);

  // === Sección: Key Columns ===
  const keySection = document.createElement("div");
  keySection.className = "comparison-section";
  keySection.innerHTML = "<label><strong>Select Key Columns</strong></label>";

  const keyBtns = document.createElement("div");
  keyBtns.className = "comparison-buttons";
  const selectAllKeys = document.createElement("button");
  selectAllKeys.id = "selectAllKeys";
  selectAllKeys.textContent = "Select All";
  selectAllKeys.className = "panel-action-btn btn-small";
  const unselectAllKeys = document.createElement("button");
  unselectAllKeys.id = "unselectAllKeys";
  unselectAllKeys.textContent = "Unselect All";
  unselectAllKeys.className = "panel-action-btn btn-small";
  keyBtns.append(selectAllKeys, unselectAllKeys);

  const keySelect = document.createElement("select");
  keySelect.id = "keyFieldsSelect";
  keySelect.multiple = true;
  keySelect.size = 6;

  keySection.append(keyBtns, keySelect);
  content.appendChild(keySection);

  // === Sección: Fields to Compare ===
  const fieldSection = document.createElement("div");
  fieldSection.className = "comparison-section";
  fieldSection.innerHTML = "<label><strong>Select Fields to Compare</strong></label>";

  const fieldBtns = document.createElement("div");
  fieldBtns.className = "comparison-buttons";
  const selectAllFields = document.createElement("button");
  selectAllFields.id = "selectAllFields";
  selectAllFields.textContent = "Select All";
  selectAllFields.className = "panel-action-btn btn-small";
  const unselectAllFields = document.createElement("button");
  unselectAllFields.id = "unselectAllFields";
  unselectAllFields.textContent = "Unselect All";
  unselectAllFields.className = "panel-action-btn btn-small";
  fieldBtns.append(selectAllFields, unselectAllFields);

  const fieldCheckboxes = document.createElement("div");
  fieldCheckboxes.id = "fieldsCheckboxes";
  fieldCheckboxes.className = "fields-grid";

  fieldSection.append(fieldBtns, fieldCheckboxes);
  content.appendChild(fieldSection);

  // === Checkbox: Only differences ===
  const diffSection = document.createElement("div");
  diffSection.className = "comparison-section";
  const diffLabel = document.createElement("label");
  const diffCheckbox = document.createElement("input");
  diffCheckbox.type = "checkbox";
  diffCheckbox.id = "onlyDiffs";
  diffCheckbox.checked = true;
  diffLabel.append(diffCheckbox, " Only show differences");
  diffSection.appendChild(diffLabel);
  content.appendChild(diffSection);

  // === Botones inferiores ===
  const footerBtns = document.createElement("div");
  footerBtns.className = "comparison-buttons comparison-footer";

  const runBtn = document.createElement("button");
  runBtn.id = "runComparisonBtn";
  runBtn.className = "panel-action-btn";
  runBtn.textContent = "Compare";

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelComparisonBtn";
  cancelBtn.className = "panel-action-btn cancel-btn";
  cancelBtn.textContent = "Cancel";

  footerBtns.append(runBtn, cancelBtn);
  content.appendChild(footerBtns);

  // === Add to modal ===
  modal.appendChild(content);
  document.body.appendChild(modal);

  // === Populate dynamic content ===
  const updateFieldSelectors = () => {
    const selectedIndices = Array.from(csvSelect.selectedOptions).map(o => parseInt(o.value));
    const selectedCSVs = selectedIndices.map(i => loadedCSVs[i]);
    const commonHeaders = getCommonHeaders(selectedCSVs);

    keySelect.innerHTML = "";
    commonHeaders.forEach(h => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      keySelect.appendChild(opt);
    });

    fieldCheckboxes.innerHTML = "";
    commonHeaders.forEach(h => {
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "field-check";
      cb.value = h;
      cb.checked = true;
      label.append(cb, ` ${h}`);
      fieldCheckboxes.appendChild(label);
    });
  };

  updateFieldSelectors();
  csvSelect.addEventListener("change", updateFieldSelectors);

  // Botones de selección
  selectAllKeys.onclick = () => {
    Array.from(keySelect.options).forEach(opt => opt.selected = true);
  };
  unselectAllKeys.onclick = () => {
    Array.from(keySelect.options).forEach(opt => opt.selected = false);
  };
  selectAllFields.onclick = () => {
    fieldCheckboxes.querySelectorAll(".field-check").forEach(cb => cb.checked = true);
  };
  unselectAllFields.onclick = () => {
    fieldCheckboxes.querySelectorAll(".field-check").forEach(cb => cb.checked = false);
  };

  runBtn.onclick = () => {
    const selectedIndices = Array.from(csvSelect.selectedOptions).map(o => parseInt(o.value));
    const selectedCSVs = selectedIndices.map(i => loadedCSVs[i]);
    const selectedKeys = Array.from(keySelect.selectedOptions).map(o => o.value);
    const selectedFields = Array.from(fieldCheckboxes.querySelectorAll(".field-check:checked")).map(cb => cb.value);
    const onlyDiffs = diffCheckbox.checked;

    if (selectedCSVs.length < 2) {
      alert("Select at least 2 CSV files.");
      return;
    }

    if (selectedKeys.length === 0 || selectedFields.length === 0) {
      alert("Please select at least one key and one field.");
      return;
    }

    modal.remove();
    runComparisonMultiple(selectedCSVs, { keys: selectedKeys, fields: selectedFields, onlyDiffs });
  };

  cancelBtn.onclick = () => modal.remove();
}



function runComparisonMultiple(csvList, { keys, fields, onlyDiffs }) {
  const buildKey = row => keys.map(k => (row[k] || "").trim()).join("||");

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

  const comparison = [];

  allKeys.forEach(k => {
    const rowResult = {};
    rowResult["Key"] = k;

    let isDifferent = false;

    fields.forEach(field => {
      const values = maps.map(m => (m[k]?.[field] || "—").trim());

      const allEqual = values.every(v => v === values[0]);
      if (!allEqual) isDifferent = true;

      values.forEach((v, i) => {
        rowResult[`${field}_File${i + 1}`] = v;
      });
    });

    if (!onlyDiffs || isDifferent) {
      comparison.push(rowResult);
    }
  });

  showComparisonResult(comparison, keys.join(" + "));
}


// ⚙️ Comparación avanzada con múltiples claves
function runComparison({ keys, fields, onlyDiffs }) {
  if (loadedCSVs.length < 2) {
    alert("Need at least 2 CSVs.");
    return;
  }

  // Construir clave única compuesta
  const buildKey = row => keys.map(k => (row[k] || "").trim()).join("||");

  const maps = loadedCSVs.map(csv => {
    const map = {};
    csv.data.forEach(row => {
      const k = buildKey(row);
      if (k) map[k] = row;
    });
    return map;
  });

  const allKeys = new Set();
  maps.forEach(map => Object.keys(map).forEach(k => allKeys.add(k)));

  const comparison = [];

  allKeys.forEach(k => {
    const rowResult = {};
    rowResult["Key"] = k;

    let isDifferent = false;

    fields.forEach(field => {
      const values = maps.map(m => (m[k]?.[field] || "—").trim());

      const allEqual = values.every(v => v === values[0]);
      if (!allEqual) isDifferent = true;

      values.forEach((v, i) => {
        rowResult[`${field}_File${i + 1}`] = v;
      });
    });

    if (!onlyDiffs || isDifferent) {
      comparison.push(rowResult);
    }
  });

  showComparisonResult(comparison, keys.join(" + "));
}

// 📊 Mostrar resultados
function showComparisonResult(data, keyDescription) {
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<p>No comparison results to show.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const headers = Object.keys(data[0]);
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = row[h];
      td.style.textAlign = "center";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  const summary = document.createElement("p");
  summary.textContent = `Compared by "${keyDescription}". Total entries: ${data.length}.`;
  container.prepend(summary);

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit Comparison";
  exitBtn.className = "panel-action-btn";
  exitBtn.style.marginTop = "1rem";
  exitBtn.onclick = () => {
    applyFilters(); // vuelve a vista normal
  };
  container.appendChild(exitBtn);
}

function generateFilterSidebar(headers) {
  const container = document.getElementById("filterInputsContainer");
  container.innerHTML = "";

  // Botones de sección
  const dateToggle = document.createElement("button");
  dateToggle.className = "filter-toggle";
  dateToggle.textContent = "Filters by Date";

  const refToggle = document.createElement("button");
  refToggle.className = "filter-toggle";
  refToggle.textContent = "Filters by Reference";

  // Contenedores de grupos
  const dateGroup = document.createElement("div");
  dateGroup.className = "filter-group collapsed";
  
  const refGroup = document.createElement("div");
  refGroup.className = "filter-group collapsed";
  
  // Eventos de toggle
  dateToggle.addEventListener("click", () => {
    dateGroup.classList.toggle("collapsed");
  });

  refToggle.addEventListener("click", () => {
    refGroup.classList.toggle("collapsed");
  });

  // Añadir al DOM
  container.appendChild(dateToggle);
  container.appendChild(dateGroup);
  container.appendChild(refToggle);
  container.appendChild(refGroup);

  headers.forEach((col) => {
    const div = document.createElement("div");
    div.className = "filter-block";

    const label = document.createElement("label");
    label.textContent = col;

    if (isDateField(col)) {
      // ESTRUCTURA TIPO REFERENCIA PARA FECHAS
      const wrapper = document.createElement("div");
      wrapper.className = "filter-wrapper";

      const collapsible = document.createElement("div");
      collapsible.className = "filter-collapsible";

      const header = document.createElement("div");
      header.className = "filter-header";

      const title = document.createElement("span");
      title.textContent = col;
      header.appendChild(title);

      const toggleIcon = document.createElement("span");
      toggleIcon.className = "toggle-icon";
      toggleIcon.textContent = "▼";
      header.appendChild(toggleIcon);

      const content = document.createElement("div");
      content.className = "filter-content"; // cerrado por defecto

      const startInput = document.createElement("input");
      startInput.type = "date";
      startInput.className = "filter-date";
      startInput.dataset.key = col + "_start";
      startInput.setAttribute("lang", "en");

      const endInput = document.createElement("input");
      endInput.type = "date";
      endInput.className = "filter-date";
      endInput.dataset.key = col + "_end";
      endInput.setAttribute("lang", "en");

      const emptyInput = document.createElement("input");
      emptyInput.type = "checkbox";
      emptyInput.dataset.key = col + "_empty";
      emptyInput.className = "filter-empty-checkbox";

      // Adjuntar checkbox al label
      label.appendChild(emptyInput);
      div.appendChild(label);
      div.appendChild(startInput);
      div.appendChild(endInput);

      // Eventos
      startInput.addEventListener("input", () => {
        filterValues[col + "_start"] = startInput.value;
        applyFilters();
      });

      endInput.addEventListener("input", () => {
        filterValues[col + "_end"] = endInput.value;
        applyFilters();
      });

      emptyInput.addEventListener("change", () => {
        filterValues[col + "_empty"] = emptyInput.checked;
        applyFilters();
      });

      // Estructura final tipo collapsible
      content.appendChild(div);
      collapsible.appendChild(header);
      collapsible.appendChild(content);
      wrapper.appendChild(collapsible);
      dateGroup.appendChild(wrapper);

      // Evento toggle visual
      header.addEventListener("click", () => {
        content.classList.toggle("visible");
        toggleIcon.textContent = content.classList.contains("visible") ? "▲" : "▼";
      });
    }
    
    else {
      const wrapper = document.createElement("div");
      wrapper.className = "filter-wrapper";
    
      const collapsible = document.createElement("div");
      collapsible.className = "filter-collapsible";
    
      const header = document.createElement("div");
      header.className = "filter-header";
    
      const title = document.createElement("span");
      title.textContent = col;
      header.appendChild(title);
    
      const toggleIcon = document.createElement("span");
      toggleIcon.className = "toggle-icon";
      toggleIcon.textContent = "▼";
      header.appendChild(toggleIcon);
    
      const resetBtn = document.createElement("button");
      resetBtn.textContent = "✕";
      resetBtn.className = "filter-reset-btn";
      header.appendChild(resetBtn);
    
      const content = document.createElement("div");
      content.className = "filter-content"; // cerrado por defecto
    
      const div = document.createElement("div");
      div.className = "filter-block";
    
      const select = document.createElement("select");
      select.multiple = true;
      select.dataset.key = col;
      select.className = "filter-multiselect";
    
      try {
        const uniqueValues = [
          ...new Set(
            originalData.map(row => row[col])
              .map(val => (val === null || val === undefined) ? "" : val.toString().trim())
        )].slice(0, 200);
    
        if (uniqueValues.includes("")) {
          const opt = document.createElement("option");
          opt.value = "__EMPTY__";
          opt.textContent = "— Empty —";
          select.appendChild(opt);
        }
    
        const allOption = document.createElement("option");
        allOption.value = "__ALL__";
        allOption.textContent = "— All —";
        select.appendChild(allOption);
    
        uniqueValues
          .filter(val => val !== "")
          .forEach(val => {
            const option = document.createElement("option");
            option.value = val;
            option.textContent = val;
            select.appendChild(option);
          });
    
        new Choices(select, {
          removeItemButton: true,
          placeholder: true,
          placeholderValue: 'Select options',
          shouldSort: false,
          searchEnabled: true
        });
    
      } catch (err) {
        console.warn(`Error generando opciones para ${col}:`, err);
      }
    
      // Eventos
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        select.selectedIndex = -1;
        Array.from(select.options).forEach(opt => opt.selected = false);
        delete filterValues[col];
        div.classList.remove("active");
        applyFilters();
      });
    
      select.addEventListener("mousedown", function (e) {
        e.preventDefault();
        const option = e.target;
        if (option.tagName !== "OPTION") return;
        option.selected = !option.selected;
    
        const selectedValues = Array.from(select.selectedOptions).map(opt => opt.value);
        const allOption = select.querySelector('option[value="__ALL__"]');
        const emptyOption = select.querySelector('option[value="__EMPTY__"]');
        const realValues = Array.from(select.options)
          .map(opt => opt.value)
          .filter(v => v !== "__ALL__" && v !== "__EMPTY__");
    
        if (option.value === "__ALL__") {
          Array.from(select.options).forEach(opt => {
            if (opt.value !== "__ALL__") opt.selected = true;
          });
          option.selected = true;
        }
    
        if (
          selectedValues.includes("__ALL__") &&
          selectedValues.length < realValues.length + (emptyOption ? 1 : 0)
        ) {
          if (allOption) allOption.selected = false;
        }
    
        const final = Array.from(select.selectedOptions).map(opt => opt.value);
        if (final.length > 0) {
          filterValues[col] = final;
          div.classList.add("active");
        } else {
          delete filterValues[col];
          div.classList.remove("active");
        }
    
        applyFilters();
      });
    
      // Montaje final
      div.appendChild(select);
      content.appendChild(div);
      collapsible.appendChild(header);
      collapsible.appendChild(content);
      wrapper.appendChild(collapsible);
      refGroup.appendChild(wrapper);
    
      // Evento toggle visual
      header.addEventListener("click", () => {
        content.classList.toggle("visible");
        toggleIcon.textContent = content.classList.contains("visible") ? "▲" : "▼";
      });
    }
  }); // ← cierre del headers.forEach
}  


function applyFilters() {
  function parseDateStrict(value) {
    if (!value) return null;
  
    // Match dd/mm/yyyy o dd-mm-yyyy con o sin hora
    const match = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+\d{2}:\d{2})?$/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  
    // Fallback: ISO format or full datetime string
    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()); // Strip time
    }
  
    return null;
  }
  
  filteredData = originalData.filter((row) => {
    const globalSearchTerm = document.getElementById("globalSearchInput")?.value.trim().toLowerCase() || "";

    const matchesGlobalSearch = globalSearchTerm === "" || Object.values(row).some(val =>
      val && val.toString().toLowerCase().includes(globalSearchTerm)
    );
    if (!matchesGlobalSearch) return false;

    return Object.keys(filterValues).every((key) => {
      if (key.endsWith("_start") || key.endsWith("_end") || key.endsWith("_empty")) {
        const baseKey = key.replace(/_(start|end|empty)$/, "");
        const rawValue = row[baseKey];
        const value = rawValue ? rawValue.trim() : "";

        const start = filterValues[baseKey + "_start"];
        const end = filterValues[baseKey + "_end"];
        const empty = filterValues[baseKey + "_empty"];

        if (empty) return value === "";

        if (!value) return false;

        const cellDate = parseDateStrict(value);
        if (!cellDate) return false;

        if (start) {
          const startDate = parseDateStrict(start);
          if (!startDate || cellDate < startDate) return false;
        }

        if (end) {
          const endDate = parseDateStrict(end);
          if (!endDate || cellDate > endDate) return false;
        }

        return true;
      } else {
        const filterVal = filterValues[key];
        const cell = row[key] ? row[key].toString().toLowerCase() : "";
        
        if (Array.isArray(filterVal)) {
          return filterVal.some(val =>
            val === "__EMPTY__" ? cell === "" : cell === val.toLowerCase()
          );
        } else {
          return cell.includes(filterVal);
        }
      }

    });
  });

  const pageSize = getRowsPerPage();
  displayTable(filteredData, 1, pageSize);
}


function isDateField(key) {
  let validCount = 0;
  let totalChecked = 0;

  for (const row of originalData) {
    const val = row[key];
    if (!val) continue;

    const str = typeof val === "string" ? val.trim() : String(val);

    // Requiere números y separadores típicos
    const likelyDate = /[\/\-]/.test(str) && /\d{2}/.test(str);
    if (!likelyDate) continue;

    totalChecked++;

    const parsed = parseFlexibleDate(str);
    if (parsed instanceof Date && !isNaN(parsed)) validCount++;

    if (totalChecked >= 10) break; // suficiente muestra
  }

  return totalChecked > 0 && (validCount / totalChecked) >= 0.6;
}


function parseFlexibleDate(value) {
  if (!value || typeof value !== "string") return null;

  // dd/mm/yyyy hh:mm:ss o dd-mm-yyyy hh:mm:ss (hora opcional)
  const match = value.match(
    /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (match) {
    const [, day, month, year, hours = "00", minutes = "00", seconds = "00"] = match;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
  }

  // ISO 8601 fallback
  const parsed = Date.parse(value);
  return isNaN(parsed) ? null : new Date(parsed);
}


  function getRowsPerPage() {
    const val = parseInt(document.getElementById("rowsPerPageSelect").value, 10);
    return isNaN(val) ? 50 : val;
  }

  function displayTable(data, page, pageSize) {
    currentPage = page;
    const container = document.getElementById("tableContainer");
    container.innerHTML = "";

    if (!data.length) {
      container.innerHTML = "<p>No data found.</p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "data-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const keys = Object.keys(data[0]);

    keys.forEach((key, index) => {
      const th = document.createElement("th");
      th.textContent = key;
      th.classList.add(`col-${index}`);
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const start = (page - 1) * pageSize;
    const end = pageSize === -1 ? data.length : start + pageSize;

    data.slice(start, end).forEach((row) => {
      const tr = document.createElement("tr");
      keys.forEach((key, index) => {
        const td = document.createElement("td");
        td.textContent = row[key] ?? "";
        td.classList.add(`col-${index}`);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    createPaginationControls(data.length, pageSize);
    // 🧮 Añadir contador de registros
const recordCountEl = document.getElementById("recordCount");
if (recordCountEl) {
  recordCountEl.textContent = `Total: ${data.length} records`;
}
const filterNameEl = document.getElementById("activeFilterName");
if (filterNameEl) {
  const select = document.getElementById("filterViewSelect");
  const selectedNames = Array.from(select.selectedOptions).map(opt => opt.value);
  filterNameEl.textContent = selectedNames.length ? `Filters: ${selectedNames.join(", ")}` : "";
}
  }

  function createPaginationControls(totalRows, pageSize) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const totalPages = Math.ceil(totalRows / (pageSize === -1 ? totalRows : pageSize));
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(currentPage - half, 1);
    let endPage = Math.min(currentPage + half, totalPages);

    if (endPage - startPage < maxButtons - 1) {
      if (startPage === 1) {
        endPage = Math.min(startPage + maxButtons - 1, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(endPage - maxButtons + 1, 1);
      }
    }

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "« Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => displayTable(filteredData, currentPage - 1, pageSize);
    pagination.appendChild(prevBtn);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = i;
      if (i === currentPage) pageBtn.disabled = true;
      pageBtn.onclick = () => displayTable(filteredData, i, pageSize);
      pagination.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next »";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => displayTable(filteredData, currentPage + 1, pageSize);
    pagination.appendChild(nextBtn);
  }

function generateColumnVisibilityControls(headers) {
  const container = document.getElementById("columnVisibility");
  container.innerHTML = "";

  // Botón Select/Deselect All
  const toggleAllBtn = document.createElement("button");
  toggleAllBtn.textContent = "Select All";
  toggleAllBtn.className = "panel-action-btn";
  toggleAllBtn.style.marginBottom = "1rem";

  let allSelected = true;

  toggleAllBtn.addEventListener("click", () => {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    allSelected = !allSelected;

    checkboxes.forEach((cb) => {
      cb.checked = allSelected;
      const colIndex = parseInt(cb.dataset.col);
      toggleColumnVisibility(colIndex, allSelected);
    });

    toggleAllBtn.textContent = allSelected ? "Deselect All" : "Select All";
  });

  container.appendChild(toggleAllBtn);

  headers.forEach((header, index) => {
    const label = document.createElement("label");
    label.className = "column-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.col = index;

    checkbox.addEventListener("change", (e) => {
      const colIndex = parseInt(e.target.dataset.col);
      toggleColumnVisibility(colIndex, e.target.checked);
    });

    const span = document.createElement("span");
    span.textContent = header;

    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}



  function toggleColumnVisibility(colIndex, visible) {
    const cells = document.querySelectorAll(`.col-${colIndex}`);
    cells.forEach((cell) => {
      cell.style.display = visible ? "" : "none";
    });
  }

  document.getElementById("rowsPerPageSelect").addEventListener("change", () => {
    const pageSize = getRowsPerPage();
    displayTable(filteredData, 1, pageSize);
  });

  document.getElementById("toggleColumnsBtn").addEventListener("click", () => {
    const panel = document.getElementById("columnsPanel");
    const overlay = document.getElementById("overlay");
  
    panel.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
  });
  
  document.getElementById("toggleFiltersBtn").addEventListener("click", () => {
    const panel = document.getElementById("leftFilterPanel");
    const overlay = document.getElementById("overlay");
  
    panel.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
  });
  

  document.getElementById("overlay").addEventListener("click", () => {
    document.getElementById("columnsPanel").classList.add("hidden");
    document.getElementById("leftFilterPanel").classList.add("hidden");
    document.getElementById("overlay").classList.add("hidden");
  });

  document.getElementById("closeColumnsPanel").addEventListener("click", () => {
    document.getElementById("columnsPanel").classList.add("hidden");
    document.getElementById("overlay").classList.add("hidden");
  });
  
  document.getElementById("closeFiltersPanel").addEventListener("click", () => {
    document.getElementById("leftFilterPanel").classList.add("hidden");
    document.getElementById("overlay").classList.add("hidden");
  });
  

document.getElementById("saveViewBtn").addEventListener("click", () => {
  const name = prompt("Enter a name for this view:");
  if (!name) return;

  const checkboxes = document.querySelectorAll('#columnVisibility input[type="checkbox"]');
  const selectedColumns = Array.from(checkboxes).map(cb => cb.checked);

  const signature = currentHeaders.slice().sort().join("|"); // "firma" del CSV actual

  const savedViews = JSON.parse(localStorage.getItem("columnViews") || "{}");
  savedViews[name] = {
    columns: selectedColumns,
    signature
  };
  localStorage.setItem("columnViews", JSON.stringify(savedViews));
  populateSavedViews();
});


document.getElementById("viewSelect").addEventListener("change", () => {
  const select = document.getElementById("viewSelect");
  const name = select.value;
  const saved = JSON.parse(localStorage.getItem("columnViews") || "{}");
  const checkboxes = document.querySelectorAll('#columnVisibility input[type="checkbox"]');

  if (!name) return; // Si no se seleccionó nada, salimos

  if (name === "All") {
    checkboxes.forEach((cb, index) => {
      cb.checked = true;
      toggleColumnVisibility(index, true);
    });
    document.getElementById("activeViewDisplay").textContent = "View: All";
  } else {
    const view = saved[name];
    if (!view) return;

    const currentSignature = currentHeaders.slice().sort().join("|");

    if (view.signature && view.signature !== currentSignature) {
      alert("This view does not match the current CSV structure.");
      document.getElementById("activeViewDisplay").textContent = "View: All";
      return;
    }

    view.columns.forEach((val, index) => {
      checkboxes[index].checked = val;
      toggleColumnVisibility(index, val);
    });

    document.getElementById("activeViewDisplay").textContent = `View: ${name}`;
  }

  // ❌ Esta línea provocaba el bug visual
  // select.value = ""; 
});


  

 // =================== GESTIÓN DE VISTAS DE COLUMNAS ===================
document.getElementById("manageViewsBtn").addEventListener("click", () => {
  const modal = document.getElementById("manageViewsModal");
  const list = document.getElementById("savedViewsList");
  const views = JSON.parse(localStorage.getItem("columnViews") || "{}");

  list.innerHTML = "";
  Object.entries(views).forEach(([name, config]) => {
    const li = document.createElement("li");
    li.textContent = name;
    const delBtn = document.createElement("button");
    delBtn.textContent = "x";
    delBtn.classList.add("panel-action-btn--small");
    delBtn.onclick = () => {
      delete views[name];
      localStorage.setItem("columnViews", JSON.stringify(views));
      populateSavedViews();
      li.remove();
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });

  modal.classList.remove("hidden");
});

document.getElementById("closeManageViews").addEventListener("click", () => {
  document.getElementById("manageViewsModal").classList.add("hidden");
});

document.getElementById("manageFilterViewsBtn").addEventListener("click", () => {
  const modal = document.getElementById("manageFilterViewsModal");
  const list = document.getElementById("savedFilterViewsList");
  const filters = JSON.parse(localStorage.getItem("savedFilters") || "{}");

  list.innerHTML = "";
  Object.entries(filters).forEach(([name]) => {
    const li = document.createElement("li");
    li.textContent = name;
    const delBtn = document.createElement("button");
    delBtn.textContent = "x";
    delBtn.classList.add("panel-action-btn--small");
    delBtn.onclick = () => {
      delete filters[name];
      localStorage.setItem("savedFilters", JSON.stringify(filters));
      populateFilterViews();
      li.remove();
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });

  modal.classList.remove("hidden");
});

document.getElementById("closeManageFilterViews").addEventListener("click", () => {
  document.getElementById("manageFilterViewsModal").classList.add("hidden");
});


// =================== GUARDAR VISTA DE FILTROS ===================
document.getElementById("saveFilterViewBtn").addEventListener("click", () => {
  const name = prompt("Enter a name for this filter view:");
  if (!name) return;

  const signature = currentHeaders.slice().sort().join("|"); // mismo método que para columnas
  const saved = JSON.parse(localStorage.getItem("savedFilters") || "{}");

  saved[name] = {
    values: { ...filterValues },
    signature
  };

  localStorage.setItem("savedFilters", JSON.stringify(saved));
  populateFilterViews();
  alert("Filter view saved.");
});


// =================== CARGAR VISTA DE FILTROS ===================
document.getElementById("filterViewSelect").addEventListener("change", () => {
  const select = document.getElementById("filterViewSelect");
  const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);

  const saved = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  const currentSignature = currentHeaders.slice().sort().join("|");

  // Limpiar filtros previos
  Object.keys(filterValues).forEach(k => delete filterValues[k]);

  selectedOptions.forEach(name => {
    const view = saved[name];
    if (!view) return;

    if (view.signature !== currentSignature) {
      console.warn(`Filter "${name}" is incompatible and will be ignored.`);
      return;
    }

    Object.assign(filterValues, view.values); // combina todos
  });

  applyFilters();
});



// =================== POBLAR SELECT DE FILTROS ===================
function populateFilterViews() {
  const filterSelect = document.getElementById("filterViewSelect");
  const saved = JSON.parse(localStorage.getItem("savedFilters") || "{}");
  const currentSignature = currentHeaders.slice().sort().join("|");

filterSelect.innerHTML = "";


  Object.entries(saved).forEach(([name, view]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;

    if (view.signature !== currentSignature) {
      option.disabled = true;
      option.title = "This filter view does not match the current CSV structure";
      option.classList.add("incompatible-view");
    } else {
      option.title = "Compatible with the current CSV structure";
    }

    filterSelect.appendChild(option);
  });
}

// =================== POBLAR SELECT DE COLUMNAS ===================
function populateSavedViews() {
  const select = document.getElementById("viewSelect");
  const views = JSON.parse(localStorage.getItem("columnViews") || "{}");

  select.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All";
  select.appendChild(allOption);

  const currentSignature = currentHeaders.slice().sort().join("|");

  Object.entries(views).forEach(([name, view]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;

    const isCompatible = view.signature === currentSignature;

    if (!isCompatible) {
      option.disabled = true;
      option.title = "This view does not match the current CSV structure";
      option.classList.add("incompatible-view");
    } else {
      option.title = "Compatible with the current CSV structure";
    }

    select.appendChild(option);
  });

  select.value = "All";
}



document.getElementById("resetFiltersBtn").addEventListener("click", () => {
  // Limpiar filtros activos
  Object.keys(filterValues).forEach(k => delete filterValues[k]);

  const selects = document.querySelectorAll(".filter-multiselect");
  selects.forEach(select => {
    Array.from(select.options).forEach(opt => opt.selected = false);
    const parent = select.closest(".filter-block");
    if (parent) parent.classList.remove("active");
  });

  const dateInputs = document.querySelectorAll("input[type='date']");
  dateInputs.forEach(input => {
    input.value = "";
  });

  const emptyCheckboxes = document.querySelectorAll(".filter-empty-checkbox");
  emptyCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });

  // Volver a "Select Filter View"
  document.getElementById("filterViewSelect").value = "";

  applyFilters();

  // Mostrar mensaje temporal
  const msg = document.createElement("div");
  msg.textContent = "All filters have been reset.";
  msg.style.position = "fixed";
  msg.style.top = "20px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.padding = "10px 20px";
  msg.style.backgroundColor = "#ffe0e0";  // fondo rojizo suave
  msg.style.color = "#8b0000";            // texto rojo oscuro
  msg.style.borderRadius = "8px";
  msg.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  msg.style.zIndex = "1000";

  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
});


// =================== CERRAR PANEL CON OVERLAY ===================
document.getElementById("overlay").addEventListener("click", () => {
  document.getElementById("columnsPanel").classList.add("hidden");
  document.getElementById("leftFilterPanel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
});
});

// Agrupa los botones CSV dentro de un menú desplegable
function groupCSVOptions() {
  const toolbarRight = document.querySelector(".toolbar-right");

  // Crear contenedor y botón principal
  const wrapper = document.createElement("div");
  wrapper.className = "csv-options-wrapper";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "csv-dropdown-toggle";
  toggleBtn.textContent = "CSV Options ▼";

  const menu = document.createElement("div");
  menu.className = "csv-dropdown-menu";

  // Reubicar los botones originales
  const fileLabel = document.querySelector("label[for='csvFileInput']");
  const fileInput = document.getElementById("csvFileInput");
  const multiLabel = document.querySelector("label[for='csvMultiInput']");
  const multiInput = document.getElementById("csvMultiInput");
  const setupBtn = document.getElementById("setupComparisonBtn");

  // Añadir al menú (preservando funcionalidad)
  if (fileLabel && fileInput) menu.appendChild(fileLabel);
  if (multiLabel && multiInput) menu.appendChild(multiLabel);
  if (setupBtn) menu.appendChild(setupBtn);

  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(menu);
  toolbarRight.insertBefore(wrapper, document.getElementById("csvFileList"));

  // Mostrar/Ocultar menú al hacer click
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  // Cerrar menú si se hace click fuera
  document.addEventListener("click", () => {
    menu.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupManageLoadedCSVsModal();

  // Esperamos a que el menú exista tras renderizar
  const observer = new MutationObserver(() => {
    const menu = document.querySelector(".csv-dropdown-menu");
    if (menu && !document.getElementById("manageLoadedCSVsBtn")) {
      createManageCSVsButton();
      observer.disconnect(); // Ya no necesitamos observar
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  groupCSVOptions(); // esto generará .csv-dropdown-menu
});

function setupManageLoadedCSVsModal() {
  if (document.getElementById("manageLoadedCSVsModal")) return;

  const modal = document.createElement("div");
  modal.id = "manageLoadedCSVsModal";
  modal.className = "modal hidden";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Loaded CSV Files</h2>
      <ul id="loadedCSVsList" class="manage-views-list"></ul>
      <button id="closeManageCSVs" class="modal-close-btn">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#closeManageCSVs").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

function createManageCSVsButton() {
  const dropdownMenu = document.querySelector(".csv-dropdown-menu");
  if (!dropdownMenu) return;

  const btn = document.createElement("button");
  btn.textContent = "Manage Loaded CSVs";
  btn.id = "manageLoadedCSVsBtn";
  btn.className = "dropdown-item";

  btn.onclick = () => {
    const modal = document.getElementById("manageLoadedCSVsModal");
    const list = document.getElementById("loadedCSVsList");
    list.innerHTML = "";

if (!Array.isArray(loadedCSVs) || loadedCSVs.length === 0) {

      const li = document.createElement("li");
      li.textContent = "No CSV files loaded.";
      list.appendChild(li);
    } else {
      loadedCSVs.forEach((csv, index) => {
        const item = document.createElement("li");
        item.className = "view-item";
        item.innerHTML = `
          ${csv.name}
          <button class="delete-btn" title="Remove CSV">✖</button>
        `;
        item.querySelector(".delete-btn").onclick = () => {
          loadedCSVs.splice(index, 1);
          item.remove();
        };
        list.appendChild(item);
      });
    }

    modal.classList.remove("hidden");
  };

  dropdownMenu.appendChild(btn);
}
