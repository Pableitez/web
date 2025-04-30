// main.js
let originalData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 50;

const filterValues = {};

// Detecta la carga del CSV
const csvInput = document.getElementById("csvFileInput");
csvInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      originalData = results.data;
      filteredData = [...originalData];
      generateFilterUI(originalData[0]);
      applyFilters();
    },
  });
});

// Crear el panel de filtros dinámicamente
function generateFilterUI(headers) {
  const filterContainer = document.getElementById("filtersContainer");
  filterContainer.innerHTML = "";

  Object.keys(headers).forEach((key) => {
    const filterBlock = document.createElement("div");
    filterBlock.className = "filter-block";

    const label = document.createElement("label");
    label.textContent = key;
    label.setAttribute("for", `filter-${key}`);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search...";
    input.id = `filter-${key}`;
    input.dataset.key = key;
    input.addEventListener("input", () => {
      filterValues[key] = input.value.trim().toLowerCase();
      applyFilters();
    });

    filterBlock.appendChild(label);
    filterBlock.appendChild(input);
    filterContainer.appendChild(filterBlock);
  });
}

// Filtra según los valores actuales
function applyFilters() {
  filteredData = originalData.filter((row) => {
    return Object.entries(filterValues).every(([key, value]) => {
      const cell = row[key] ? row[key].toString().toLowerCase() : "";
      return cell.includes(value);
    });
  });
  displayTable(filteredData, 1);
}

// Muestra la tabla paginada
function displayTable(data, page) {
  currentPage = page;
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<p>No data found.</p>";
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  Object.keys(data[0]).forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  data.slice(start, end).forEach((row) => {
    const tr = document.createElement("tr");
    Object.values(row).forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
  createPaginationControls(data.length);
}

// Crear la paginación
function createPaginationControls(totalRows) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalRows / rowsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.disabled = true;
    btn.addEventListener("click", () => displayTable(filteredData, i));
    pagination.appendChild(btn);
  }
}


function createPaginationControls(totalRows) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalRows / rowsPerPage);
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
  prevBtn.onclick = () => displayTable(filteredData, currentPage - 1);
  pagination.appendChild(prevBtn);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === currentPage) pageBtn.disabled = true;
    pageBtn.onclick = () => displayTable(filteredData, i);
    pagination.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next »";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => displayTable(filteredData, currentPage + 1);
  pagination.appendChild(nextBtn);
}
