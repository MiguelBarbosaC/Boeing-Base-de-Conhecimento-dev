

const DATA_URL = "data.json";

const cardContainer = document.getElementById("card-container");
const searchInput = document.getElementById("search-input");
const searchForm = document.getElementById("search-form");
const clearButton = document.getElementById("clear-button");
const noResults = document.getElementById("no-results");
const filterSelect = document.getElementById("filter-select");
const sortSelect = document.getElementById("sort-select");

let dados = [];         
let dadosAtuais = [];   


function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}


async function carregarDados() {
  try {
    const resp = await fetch(DATA_URL, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    
    dados = Array.isArray(json) ? json : (json.models || []);
    dadosAtuais = [...dados];
  } catch (err) {
    console.error("Erro ao carregar data.json:", err);
    cardContainer.innerHTML = `<p style="color: #a00;">Falha ao carregar dados. Verifique o arquivo data.json</p>`;
  }
}


function renderizarCards(lista) {
  cardContainer.innerHTML = "";
  if (!lista || lista.length === 0) {
    noResults.hidden = false;
    return;
  }
  noResults.hidden = true;

  const fragment = document.createDocumentFragment();

  for (const item of lista) {
    const article = document.createElement("article");
    article.className = "card";
    article.setAttribute("tabindex", "0");
    article.innerHTML = `
      <h3>${escapeHtml(item.nome)}</h3>
      <div class="meta"><strong>Ano:</strong> ${escapeHtml(String(item.data_criacao))}</div>
      <p>${escapeHtml(item.descricao)}</p>
      <a href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">Saiba mais</a>
    `;
    fragment.appendChild(article);
  }

  cardContainer.appendChild(fragment);
}


function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


function escapeAttribute(url) {
  
  if (!url) return "#";
  return url.replace(/"/g, "%22").replace(/'/g, "%27");
}


function aplicarBuscaEFiltros() {
  const termosDeBusca = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtro = filterSelect.value;
  const sort = sortSelect.value;

  let filtrados = dados.filter(item => {
    
    const textoItem = [
      item.nome,
      item.descricao,
      item.data_criacao,
      ...(item.tags || [])
    ].join(' ').toLowerCase();

    
    return termosDeBusca.every(termo => textoItem.includes(termo));
  });

  
  if (filtro === "legacy") {
    filtrados = filtrados.filter(it => it.status === "legacy" || it.status === "out-of-production" || it.legado === true);
  } else if (filtro === "in-production") {
    filtrados = filtrados.filter(it => it.status === "in-production" || it.status === "production");
  }

  
  if (sort === "name") {
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" }));
  } else if (sort === "year-desc") {
    filtrados.sort((a, b) => (Number(b.data_criacao) || 0) - (Number(a.data_criacao) || 0));
  } else if (sort === "year-asc") {
    filtrados.sort((a, b) => (Number(a.data_criacao) || 0) - (Number(b.data_criacao) || 0));
  }

  dadosAtuais = filtrados;
  renderizarCards(dadosAtuais);
}


function limparBusca() {
  searchInput.value = "";
  filterSelect.value = "all";
  sortSelect.value = "name";
  aplicarBuscaEFiltros();
}


async function init() {
  await carregarDados();
  renderizarCards(dados); 

  
  searchForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    aplicarBuscaEFiltros();
  });
  clearButton.addEventListener("click", () => {
    limparBusca();
    searchInput.focus();
  });
  filterSelect.addEventListener("change", aplicarBuscaEFiltros);
  sortSelect.addEventListener("change", aplicarBuscaEFiltros);
}

document.addEventListener("DOMContentLoaded", init);
