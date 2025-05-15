

import { initCSVComparator } from './csvcomparator.js';
   // 📦 IndexedDB setup
let db;
let originalData = [];
let filteredData = [];
let currentHeaders = [];
let currentPage = 1;
let initialCSVData = null;
const filterValues = {};
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
       
        document.getElementById("csvFileInput").addEventListener("change", function (e) {
          const file = e.target.files[0];
          if (!file) return;

          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
              originalData = results.data;
              initialCSVData = [...results.data];
              filteredData = [...originalData];
              currentHeaders = Object.keys(originalData[0]);
              generateFilterSidebar(currentHeaders, "filterInputsContainer");
              generateColumnVisibilityControls(currentHeaders);
              applyFilters();
              populateSavedViews();
              populateFilterViews();


              // Botón Export to Excel
const exportBtn = document.getElementById("exportExcelBtn");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = Object.keys(filteredData[0]);
    const rows = filteredData.map(row => headers.map(h => row[h]));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");

    const filename = `evian_export_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  });
}


              const toggleHeader = document.getElementById("toggleSavedFilters");
      if (toggleHeader) {
        toggleHeader.addEventListener("click", () => {
          const container = document.getElementById("savedFiltersContainer");
          const icon = toggleHeader.querySelector(".toggle-icon");
          container.classList.toggle("visible");
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
      if (loadedCSVs.length < 2) {
        alert("Load at least two CSVs to compare.");
        return;
      }
      console.log("🚀 Ejecutando initCSVComparator...");
      initCSVComparator(loadedCSVs);
    });
  }
});


function generateFilterSidebar(headers) {
  const genericContainer = document.getElementById("filterInputsContainer");
  const referenceContainer = document.getElementById("referenceFilterPanel");
  const dateContainer = document.getElementById("dateFilterPanel");

  [genericContainer, referenceContainer, dateContainer].forEach(c => c && (c.innerHTML = ""));

  headers.forEach((col) => {
    const isDate = isDateField(col);
    const isReference = /ref|code|id|number/i.test(col) && !isDate;

    const targetContainer =
      isDate ? dateContainer :
      isReference ? referenceContainer :
      genericContainer;

    if (!targetContainer) return;

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
    header.appendChild(toggleIcon);

    const content = document.createElement("div");
    content.className = "filter-content";

    const div = document.createElement("div");
    div.className = "filter-block";

    if (isDate) {
      const startInput = document.createElement("input");
      startInput.type = "date";
      startInput.className = "filter-date";
      startInput.dataset.key = col + "_start";

      const endInput = document.createElement("input");
      endInput.type = "date";
      endInput.className = "filter-date";
      endInput.dataset.key = col + "_end";

      const emptyBtn = document.createElement("button");
      emptyBtn.type = "button";
      emptyBtn.className = "filter-empty-toggle";
      emptyBtn.textContent = "Empty";
      emptyBtn.dataset.key = col + "_empty";

      emptyBtn.addEventListener("click", () => {
        emptyBtn.classList.toggle("active");
        const isActive = emptyBtn.classList.contains("active");
        filterValues[col + "_empty"] = isActive;
        div.classList.add("active");
        applyFilters();
      });

      const label = document.createElement("label");
      div.appendChild(label);
      div.appendChild(startInput);
      div.appendChild(endInput);
      div.appendChild(emptyBtn);

      const resetBtn = document.createElement("button");
      resetBtn.textContent = "✕";
      resetBtn.className = "filter-reset-btn";
      resetBtn.type = "button";
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startInput.value = "";
        endInput.value = "";
        emptyBtn.classList.remove("active");
        delete filterValues[col + "_start"];
        delete filterValues[col + "_end"];
        delete filterValues[col + "_empty"];
        div.classList.remove("active");
        applyFilters();
      });
      header.appendChild(resetBtn);

      startInput.addEventListener("input", () => {
        filterValues[col + "_start"] = startInput.value;
        div.classList.add("active");
        applyFilters();
      });

      endInput.addEventListener("input", () => {
        filterValues[col + "_end"] = endInput.value;
        div.classList.add("active");
        applyFilters();
      });

    } else if (isReference) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "reference-autocomplete";
      input.placeholder = `Search ${col}...`;
      input.dataset.key = col;

      const suggestionBox = document.createElement("ul");
      suggestionBox.className = "autocomplete-list hidden";

      const uniqueValues = [...new Set(originalData.map(row => row[col] || "").map(String))].slice(0, 300);

      input.addEventListener("input", () => {
        const raw = input.value;
        const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          filterValues[col] = parts;
          div.classList.add("active");
        } else {
          delete filterValues[col];
          div.classList.remove("active");
        }
        applyFilters();

        const last = parts.at(-1).toLowerCase();
        suggestionBox.innerHTML = "";

        const matches = uniqueValues.filter(val => val.toLowerCase().includes(last)).slice(0, 10);
        if (matches.length === 0) {
          suggestionBox.classList.add("hidden");
          return;
        }

        matches.forEach(val => {
          const li = document.createElement("li");
          li.textContent = val;
          li.className = "autocomplete-item";
          li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const newParts = [...parts.slice(0, -1), val];
            input.value = newParts.join(", ");
            filterValues[col] = newParts;
            div.classList.add("active");
            suggestionBox.classList.add("hidden");
            applyFilters();
          });
          suggestionBox.appendChild(li);
        });

        suggestionBox.classList.remove("hidden");
      });

      input.addEventListener("blur", () => {
        setTimeout(() => suggestionBox.classList.add("hidden"), 150);
      });

      div.appendChild(input);
      div.appendChild(suggestionBox);

    } else {
      const select = document.createElement("select");
      select.multiple = true;
      select.dataset.key = col;
      select.className = "filter-multiselect";

      try {
        const uniqueValues = [...new Set(
          originalData.map(row => row[col] || "").map(String)
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

        uniqueValues.filter(val => val !== "").forEach(val => {
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

      const resetBtn = document.createElement("button");
      resetBtn.textContent = "✕";
      resetBtn.className = "filter-reset-btn";
      header.appendChild(resetBtn);

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

      div.appendChild(select);
    }

    content.appendChild(div);
    collapsible.appendChild(header);
    collapsible.appendChild(content);
    wrapper.appendChild(collapsible);
    targetContainer.appendChild(wrapper);

    header.addEventListener("click", () => {
      content.classList.toggle("visible");
    });
  });
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
  updateActiveFiltersSummary();

}

function updateActiveFiltersSummary() {
  const summaryEl = document.getElementById("filtersSummaryText");
  const box = document.getElementById("activeFiltersSummary");

  summaryEl.innerHTML = "";

  const entries = Object.entries(filterValues);
  if (!entries.length) {
    box.style.display = "none";
    return;
  }

  entries.forEach(([key, value]) => {
    const pill = document.createElement("div");
    pill.className = "filter-pill";

    let label = "";

    if (Array.isArray(value)) {
      label = `${key}: ${value.join(", ")}`;
    } else if (typeof value === "boolean") {
      if (value) label = `${key.replace("_empty", "")}: (empty)`;
    } else if (key.endsWith("_start") || key.endsWith("_end")) {
      const base = key.replace(/_(start|end)$/, "");
      const type = key.endsWith("_start") ? "from" : "to";
      label = `${base} ${type}: ${value}`;
    } else {
      label = `${key}: ${value}`;
    }

    pill.textContent = label;

    const x = document.createElement("button");
    x.textContent = "✕";
    x.addEventListener("click", () => {
      delete filterValues[key];
      applyFilters(); // vuelve a generar todo
    });

    pill.appendChild(x);
    summaryEl.appendChild(pill);
  });

  box.style.display = "block";
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
  const modal = document.getElementById("filterModal");
  modal.classList.remove("hidden");
});

document.getElementById("overlay").addEventListener("click", () => {
  document.getElementById("columnsPanel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
});

document.getElementById("filterModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("filterModal")) {
    document.getElementById("filterModal").classList.add("hidden");
  }
});
  document.getElementById("closeColumnsPanel").addEventListener("click", () => {
    document.getElementById("columnsPanel").classList.add("hidden");
    document.getElementById("overlay").classList.add("hidden");
  });
  
document.getElementById("closeFilterModalBtn").addEventListener("click", () => {
  document.getElementById("filterModal").classList.add("hidden");
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
    li.className = "view-item";
    li.innerHTML = `
      <div class="saved-view-card">${name}</div>
      <button class="delete-btn" title="Remove view">✖</button>
    `;

    li.querySelector(".delete-btn").onclick = () => {
      delete views[name];
      localStorage.setItem("columnViews", JSON.stringify(views));
      populateSavedViews();
      li.remove();
    };

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
    li.className = "view-item";
    li.innerHTML = `
      <div class="saved-view-card">${name}</div>
      <button class="delete-btn" title="Remove filter">✖</button>
    `;
    li.querySelector(".delete-btn").onclick = () => {
      delete filters[name];
      localStorage.setItem("savedFilters", JSON.stringify(filters));
      populateFilterViews();
      li.remove();
    };
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

document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  applyFilters(); // Aplica los filtros activos
  document.getElementById("filterModal").classList.add("hidden"); // Cierra el modal
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
  toggleBtn.textContent = "CSV Options";

  const menu = document.createElement("div");
  menu.className = "csv-dropdown-menu";

  // Reubicar los botones originales
  const fileLabel = document.querySelector("label[for='csvFileInput']");
  const fileInput = document.getElementById("csvFileInput");

  const multiLabel = document.querySelector("label[for='csvMultiInput']");
  const multiInput = document.getElementById("csvMultiInput");

  const setupBtn = document.getElementById("setupComparisonBtn");

  // 💬 Renombrar y unificar estilos
  if (fileLabel) {
    fileLabel.textContent = "Select CSV File";
    fileLabel.className = "dropdown-item";
    menu.appendChild(fileLabel);
  }

  if (multiLabel) {
    multiLabel.textContent = "Upload CSVs to Compare";
    multiLabel.className = "dropdown-item";
    menu.appendChild(multiLabel);
  }

  if (setupBtn) {
    setupBtn.textContent = "Start Comparison";
    setupBtn.className = "dropdown-item";
    menu.appendChild(setupBtn);
  }

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

  // 👁️ Observar aparición del menú de CSVs
  const observer = new MutationObserver(() => {
    const menu = document.querySelector(".csv-dropdown-menu");
    if (menu && !document.getElementById("manageLoadedCSVsBtn")) {
      createManageCSVsButton();
      observer.disconnect(); // dejar de observar
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ✅ Tabs del modal de filtros
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".filter-panel").forEach(panel => panel.classList.remove("active"));

      const targetId = {
        generic: "filterInputsContainer",
        reference: "referenceFilterPanel",
        date: "dateFilterPanel",
        saved: "savedFiltersPanel"
      }[tab.dataset.target];

      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  groupCSVOptions();

  // 🔽 Desplegable de filtros activos
  const toggleBtn = document.getElementById("toggleFiltersDropdown");
  const dropdown = document.getElementById("filtersDropdown");
  const toggleLabel = document.getElementById("filtersToggleLabel");

  if (toggleBtn && dropdown && toggleLabel) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === "block";
      dropdown.style.display = isOpen ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      const summaryBox = document.getElementById("activeFiltersSummary");
      if (!summaryBox.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

  // ✅ Botón Apply del modal de filtros = cerrar modal
  const applyBtn = document.getElementById("applyFilterBtn");
  const closeBtn = document.getElementById("closeFilterModalBtn");
  if (applyBtn && closeBtn) {
    applyBtn.addEventListener("click", () => {
      closeBtn.click();
    });
  }
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

document.getElementById("comparisonOverlay").addEventListener("click", () => {
  const overlay = document.getElementById("comparisonOverlay");
  const container = document.getElementById("tableContainer");

  // Oculta overlay y limpia la tabla de comparación
  overlay.classList.add("hidden");
  container.innerHTML = "";
  container.classList.remove("comparison-mode"); // elimina estilo de comparación

  // Restaura la tabla principal
  if (Array.isArray(initialCSVData) && initialCSVData.length > 0) {
    originalData = [...initialCSVData];
    filteredData = [...originalData];
    currentHeaders = Object.keys(originalData[0]);

    generateFilterSidebar(currentHeaders);
    generateColumnVisibilityControls(currentHeaders);
    applyFilters();
    populateSavedViews();
    populateFilterViews();

    const pageSize = getRowsPerPage();
    displayTable(filteredData, 1, pageSize);
  } else {
    container.innerHTML = "<p>No initial CSV loaded.</p>";
  }
});

