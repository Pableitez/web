document.addEventListener("DOMContentLoaded", function () {

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
  });

// ------------ Panel dinámico de filtros -------------- //
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
  dateGroup.className = "filter-group";

  const refGroup = document.createElement("div");
  refGroup.className = "filter-group";

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
      const startInput = document.createElement("input");
      startInput.type = "date";
      startInput.className = "filter-date";
      startInput.dataset.key = col + "_start";

      const endInput = document.createElement("input");
      endInput.type = "date";
      endInput.className = "filter-date";
      endInput.dataset.key = col + "_end";

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

      dateGroup.appendChild(div);

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
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        select.selectedIndex = -1;
        Array.from(select.options).forEach(opt => opt.selected = false);
        delete filterValues[col];
        div.classList.remove("active");
        applyFilters();
      });
      header.appendChild(resetBtn);
    
      const content = document.createElement("div");
      content.className = "filter-content";
    
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

          const choicesInstance = new Choices(select, {
            removeItemButton: true,
            placeholder: true,
            placeholderValue: 'Select options',
            shouldSort: false,
            searchEnabled: true
          });
          


      } catch (err) {
        console.warn(`Error generando opciones para ${col}:`, err);
      }
    
      // Evento toggle collapse
      header.addEventListener("click", () => {
        content.classList.toggle("visible");
        toggleIcon.textContent = content.classList.contains("visible") ? "▲" : "▼";
      });
    
      // Evento selección personalizado
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
    
      // Estructura final
      content.appendChild(select);
      collapsible.appendChild(header);
      collapsible.appendChild(content);
      wrapper.appendChild(collapsible);
      div.appendChild(wrapper);
      refGroup.appendChild(div);
    }
    
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

    headers.forEach((header, index) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.marginBottom = "0.5rem";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.dataset.col = index;

      checkbox.addEventListener("change", (e) => {
        const colIndex = parseInt(e.target.dataset.col);
        toggleColumnVisibility(colIndex, e.target.checked);
      });

      label.appendChild(checkbox);
      label.append(" " + header);
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

    const savedViews = JSON.parse(localStorage.getItem("columnViews") || "{}");
    savedViews[name] = selectedColumns;
    localStorage.setItem("columnViews", JSON.stringify(savedViews));
    populateSavedViews();
  });

  document.getElementById("viewSelect").addEventListener("change", () => {
    const name = document.getElementById("viewSelect").value;
    const views = JSON.parse(localStorage.getItem("columnViews") || "{}");
    const checkboxes = document.querySelectorAll('#columnVisibility input[type="checkbox"]');
  
    if (name === "All") {
      // Mostrar todas las columnas
      checkboxes.forEach((cb, index) => {
        cb.checked = true;
        toggleColumnVisibility(index, true);
      });
    } else if (views[name]) {
      // Mostrar sólo las seleccionadas en la vista guardada
      views[name].forEach((val, index) => {
        checkboxes[index].checked = val;
        toggleColumnVisibility(index, val);
      });
    }
  });
  

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

  function populateSavedViews() {
    const select = document.getElementById("viewSelect");
    const views = JSON.parse(localStorage.getItem("columnViews") || "{}");
  
    select.innerHTML = "";
  
    // Insertar opción "All"
    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = "All";
    select.appendChild(allOption);
  
    // Insertar las demás vistas guardadas
    Object.keys(views).forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  
    // Seleccionar "All" por defecto
    select.value = "All";
  
    // Aplicar vista All si existe
    if (views["All"]) {
      const checkboxes = document.querySelectorAll('#columnVisibility input[type="checkbox"]');
      views["All"].forEach((val, index) => {
        checkboxes[index].checked = val;
        toggleColumnVisibility(index, val);
      });
    }
  }
  
});

document.getElementById("overlay").addEventListener("click", () => {
  document.getElementById("columnsPanel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
});
