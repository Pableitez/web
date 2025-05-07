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
      },
    });
  });

// ------------ Panel dinamico de filtros -------------- //

function generateFilterSidebar(headers) {
  const container = document.getElementById("filterInputsContainer");
  container.innerHTML = "";
  headers.forEach((col) => {
    const div = document.createElement("div");
    div.className = "filter-block";

    const label = document.createElement("label");
    label.textContent = col;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Search ${col}`;
    input.dataset.key = col;
    input.addEventListener("input", () => {
      filterValues[col] = input.value.trim().toLowerCase();
      applyFilters();
    });

    div.appendChild(label);
    div.appendChild(input);
    container.appendChild(div);
  });
}


  function applyFilters() {
    filteredData = originalData.filter((row) => {
      return Object.entries(filterValues).every(([key, value]) => {
        const cell = row[key] ? row[key].toString().toLowerCase() : "";
        return cell.includes(value);
      });
    });

    const pageSize = getRowsPerPage();
    displayTable(filteredData, 1, pageSize);
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
    panel.classList.toggle("hidden");
  });

  document.getElementById("closeColumnsPanel").addEventListener("click", () => {
    document.getElementById("columnsPanel").classList.add("hidden");
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
      delBtn.textContent = "❌";
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
