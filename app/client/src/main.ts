import './style.css'
import { api } from './api/client'

// Global state
let currentFavorites: FavoriteItem[] = [];
let currentQueryText = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeQueryInput();
  initializeFileUpload();
  initializeModal();
  initializeGenerateQueryButton();
  loadDatabaseSchema();
  initializeFavorites();
});

// Query Input Functionality
function initializeQueryInput() {
  const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;
  const queryButton = document.getElementById('query-button') as HTMLButtonElement;
  
  queryButton.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;
    
    queryButton.disabled = true;
    queryButton.innerHTML = '<span class="loading"></span>';
    
    try {
      const response = await api.processQuery({
        query,
        llm_provider: 'openai'  // Default to OpenAI
      });
      
      displayResults(response, query);
      
      // Clear the input field on success
      queryInput.value = '';
    } catch (error) {
      displayError(error instanceof Error ? error.message : 'Query failed');
    } finally {
      queryButton.disabled = false;
      queryButton.textContent = 'Query';
    }
  });
  
  // Allow Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to submit
  queryInput.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      queryButton.click();
    }
  });
}

// File Upload Functionality
function initializeFileUpload() {
  const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const browseButton = document.getElementById('browse-button') as HTMLButtonElement;
  
  // Browse button click
  browseButton.addEventListener('click', () => fileInput.click());
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  });
  
  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  });
}

// Handle file upload
async function handleFileUpload(file: File) {
  try {
    const response = await api.uploadFile(file);
    
    if (response.error) {
      displayError(response.error);
    } else {
      displayUploadSuccess(response);
      await loadDatabaseSchema();
    }
  } catch (error) {
    displayError(error instanceof Error ? error.message : 'Upload failed');
  }
}

// Load database schema
async function loadDatabaseSchema() {
  try {
    const response = await api.getSchema();
    if (!response.error) {
      displayTables(response.tables);
    }
  } catch (error) {
    console.error('Failed to load schema:', error);
  }
}

// Display query results
function displayResults(response: QueryResponse, query: string) {
  // Store current query context for star button
  currentQueryText = query;

  const resultsSection = document.getElementById('results-section') as HTMLElement;
  const sqlDisplay = document.getElementById('sql-display') as HTMLDivElement;
  const resultsContainer = document.getElementById('results-container') as HTMLDivElement;
  const resultsHeader = resultsSection.querySelector('.results-header') as HTMLElement;

  resultsSection.style.display = 'block';

  // Display natural language query and SQL
  sqlDisplay.innerHTML = `
    <div class="query-display">
      <strong>Query:</strong> ${query}
    </div>
    <div class="sql-query">
      <strong>SQL:</strong> <code>${response.sql}</code>
    </div>
  `;

  // Display results table
  if (response.error) {
    resultsContainer.innerHTML = `<div class="error-message">${response.error}</div>`;
  } else if (response.results.length === 0) {
    resultsContainer.innerHTML = '<p>No results found.</p>';
  } else {
    const table = createResultsTable(response.results, response.columns);
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(table);
  }

  // Inject star button into results header (between h2 and toggle button)
  const existingStar = document.getElementById('star-button');
  if (existingStar) existingStar.remove();
  const starButton = document.createElement('button');
  starButton.className = 'star-button';
  starButton.title = 'Save as favorite';
  starButton.textContent = '☆';
  starButton.id = 'star-button';
  updateStarButtonState(starButton, query);
  starButton.addEventListener('click', () => handleStarClick(starButton, query, response.sql));
  const toggleButton = document.getElementById('toggle-results') as HTMLButtonElement;
  resultsHeader.insertBefore(starButton, toggleButton);

  // Initialize toggle button
  toggleButton.addEventListener('click', () => {
    resultsContainer.style.display = resultsContainer.style.display === 'none' ? 'block' : 'none';
    toggleButton.textContent = resultsContainer.style.display === 'none' ? 'Show' : 'Hide';
  });
}

// Create results table
function createResultsTable(results: Record<string, any>[], columns: string[]): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'results-table';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  results.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.textContent = row[col] !== null ? String(row[col]) : '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  return table;
}

// Display tables
function displayTables(tables: TableSchema[]) {
  const tablesList = document.getElementById('tables-list') as HTMLDivElement;
  
  if (tables.length === 0) {
    tablesList.innerHTML = '<p class="no-tables">No tables loaded. Upload data or use sample data to get started.</p>';
    return;
  }
  
  tablesList.innerHTML = '';
  
  tables.forEach(table => {
    const tableItem = document.createElement('div');
    tableItem.className = 'table-item';
    
    // Header section
    const tableHeader = document.createElement('div');
    tableHeader.className = 'table-header';
    
    const tableLeft = document.createElement('div');
    tableLeft.style.display = 'flex';
    tableLeft.style.alignItems = 'center';
    tableLeft.style.gap = '1rem';
    
    const tableName = document.createElement('div');
    tableName.className = 'table-name';
    tableName.textContent = table.name;
    
    const tableInfo = document.createElement('div');
    tableInfo.className = 'table-info';
    tableInfo.textContent = `${table.row_count} rows, ${table.columns.length} columns`;
    
    tableLeft.appendChild(tableName);
    tableLeft.appendChild(tableInfo);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-table-button';
    removeButton.innerHTML = '&times;';
    removeButton.title = 'Remove table';
    removeButton.onclick = () => removeTable(table.name);
    
    tableHeader.appendChild(tableLeft);
    tableHeader.appendChild(removeButton);
    
    // Columns section
    const tableColumns = document.createElement('div');
    tableColumns.className = 'table-columns';
    
    table.columns.forEach(column => {
      const columnTag = document.createElement('span');
      columnTag.className = 'column-tag';
      
      const columnName = document.createElement('span');
      columnName.className = 'column-name';
      columnName.textContent = column.name;
      
      const columnType = document.createElement('span');
      columnType.className = 'column-type';
      const typeEmoji = getTypeEmoji(column.type);
      columnType.textContent = `${typeEmoji} ${column.type}`;
      
      columnTag.appendChild(columnName);
      columnTag.appendChild(columnType);
      tableColumns.appendChild(columnTag);
    });
    
    tableItem.appendChild(tableHeader);
    tableItem.appendChild(tableColumns);
    tablesList.appendChild(tableItem);
  });
}

// Display upload success
function displayUploadSuccess(response: FileUploadResponse) {
  // Close modal
  const modal = document.getElementById('upload-modal') as HTMLElement;
  modal.style.display = 'none';
  
  // Show success message
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = `Table "${response.table_name}" created successfully with ${response.row_count} rows!`;
  successDiv.style.cssText = `
    background: rgba(40, 167, 69, 0.1);
    border: 1px solid var(--success-color);
    color: var(--success-color);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  `;
  
  const tablesSection = document.getElementById('tables-section') as HTMLElement;
  tablesSection.insertBefore(successDiv, tablesSection.firstChild);
  
  // Remove success message after 3 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// Display error
function displayError(message: string) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  const resultsContainer = document.getElementById('results-container') as HTMLDivElement;
  resultsContainer.innerHTML = '';
  resultsContainer.appendChild(errorDiv);
  
  const resultsSection = document.getElementById('results-section') as HTMLElement;
  resultsSection.style.display = 'block';
}

// Initialize modal
function initializeModal() {
  const uploadButton = document.getElementById('upload-data-button') as HTMLButtonElement;
  const modal = document.getElementById('upload-modal') as HTMLElement;
  const closeButton = modal.querySelector('.close-modal') as HTMLButtonElement;
  
  // Open modal
  uploadButton.addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  
  // Close modal
  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Initialize sample data buttons
  const sampleButtons = modal.querySelectorAll('.sample-button');
  sampleButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const sampleType = (e.currentTarget as HTMLElement).dataset.sample;
      await loadSampleData(sampleType!);
    });
  });
}

// Generate Query Button
function initializeGenerateQueryButton() {
  const generateQueryButton = document.getElementById('generate-query-button') as HTMLButtonElement;
  const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;

  generateQueryButton.addEventListener('click', async () => {
    generateQueryButton.disabled = true;
    generateQueryButton.textContent = 'Generating...';

    try {
      const response = await api.generateQuery();
      if (response.error) {
        displayError(response.error);
      } else if (response.query) {
        queryInput.value = response.query;
      } else {
        displayError('No query was generated. Please try again.');
      }
    } catch (error) {
      displayError(error instanceof Error ? error.message : 'Failed to generate query');
    } finally {
      generateQueryButton.disabled = false;
      generateQueryButton.textContent = 'Generate Query';
    }
  });
}

// Remove table
async function removeTable(tableName: string) {
  if (!confirm(`Are you sure you want to remove the table "${tableName}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/table/${tableName}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove table');
    }
    
    // Reload schema
    await loadDatabaseSchema();
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = `Table "${tableName}" removed successfully!`;
    successDiv.style.cssText = `
      background: rgba(40, 167, 69, 0.1);
      border: 1px solid var(--success-color);
      color: var(--success-color);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    `;
    
    const tablesSection = document.getElementById('tables-section') as HTMLElement;
    tablesSection.insertBefore(successDiv, tablesSection.firstChild);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  } catch (error) {
    displayError(error instanceof Error ? error.message : 'Failed to remove table');
  }
}

// Get emoji for data type
function getTypeEmoji(type: string): string {
  const upperType = type.toUpperCase();
  
  // SQLite types
  if (upperType.includes('INT')) return '🔢';
  if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) return '💯';
  if (upperType.includes('TEXT') || upperType.includes('CHAR') || upperType.includes('STRING')) return '📝';
  if (upperType.includes('DATE') || upperType.includes('TIME')) return '📅';
  if (upperType.includes('BOOL')) return '✓';
  if (upperType.includes('BLOB')) return '📦';
  
  // Default
  return '📊';
}

// Favorites: initialize panel controls
function initializeFavorites() {
  const favoritesButton = document.getElementById('favorites-button') as HTMLButtonElement;
  const closeFavorites = document.getElementById('close-favorites') as HTMLButtonElement;
  const favoritesOverlay = document.getElementById('favorites-overlay') as HTMLDivElement;

  favoritesButton.addEventListener('click', () => toggleFavoritesPanel(true));
  closeFavorites.addEventListener('click', () => toggleFavoritesPanel(false));
  favoritesOverlay.addEventListener('click', () => toggleFavoritesPanel(false));

  loadFavorites();
}

function toggleFavoritesPanel(open: boolean) {
  const panel = document.getElementById('favorites-panel') as HTMLElement;
  const overlay = document.getElementById('favorites-overlay') as HTMLElement;
  panel.classList.toggle('open', open);
  overlay.style.display = open ? 'block' : 'none';
  if (open) loadFavorites();
}

async function loadFavorites() {
  try {
    const response = await api.getFavorites();
    currentFavorites = response.favorites ?? [];
    renderFavoritesList();
    // Update star button state if it exists
    const starBtn = document.getElementById('star-button') as HTMLButtonElement | null;
    if (starBtn && currentQueryText) {
      updateStarButtonState(starBtn, currentQueryText);
    }
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
}

function renderFavoritesList() {
  const listEl = document.getElementById('favorites-list') as HTMLDivElement;
  listEl.innerHTML = '';

  if (currentFavorites.length === 0) {
    listEl.innerHTML = '<p class="no-favorites">No favorites saved yet. Run a query and click the star to save it.</p>';
    return;
  }

  currentFavorites.forEach(item => {
    const el = document.createElement('div');
    el.className = 'favorite-item';

    const queryEl = document.createElement('div');
    queryEl.className = 'favorite-item-query';
    queryEl.textContent = item.query_text;

    const sqlEl = document.createElement('div');
    sqlEl.className = 'favorite-item-sql';
    sqlEl.textContent = item.sql_text;

    const footer = document.createElement('div');
    footer.className = 'favorite-item-footer';

    const dateEl = document.createElement('span');
    dateEl.className = 'favorite-item-date';
    dateEl.textContent = new Date(item.created_at).toLocaleDateString();

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-favorite-btn';
    deleteBtn.textContent = 'Remove';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteFavorite(item.id);
    });

    footer.appendChild(dateEl);
    footer.appendChild(deleteBtn);

    el.appendChild(queryEl);
    el.appendChild(sqlEl);
    el.appendChild(footer);

    el.addEventListener('click', () => rerunFavorite(item.query_text));
    listEl.appendChild(el);
  });
}

function rerunFavorite(queryText: string) {
  toggleFavoritesPanel(false);
  const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;
  queryInput.value = queryText;
  const queryButton = document.getElementById('query-button') as HTMLButtonElement;
  queryButton.click();
}

async function handleDeleteFavorite(id: number) {
  try {
    await api.deleteFavorite(id);
    await loadFavorites();
  } catch (error) {
    console.error('Failed to delete favorite:', error);
  }
}

function updateStarButtonState(btn: HTMLButtonElement, queryText: string) {
  const isFavorited = currentFavorites.some(f => f.query_text === queryText);
  if (isFavorited) {
    btn.classList.add('starred');
    btn.textContent = '★';
  } else {
    btn.classList.remove('starred');
    btn.textContent = '☆';
  }
}

async function handleStarClick(btn: HTMLButtonElement, queryText: string, sqlText: string) {
  const existing = currentFavorites.find(f => f.query_text === queryText);
  if (existing) {
    await handleDeleteFavorite(existing.id);
  } else {
    try {
      await api.addFavorite({ query_text: queryText, sql_text: sqlText });
      await loadFavorites();
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  }
  updateStarButtonState(btn, queryText);
}

// Load sample data
async function loadSampleData(sampleType: string) {
  try {
    let filename: string;
    
    if (sampleType === 'users') {
      filename = 'users.json';
    } else if (sampleType === 'products') {
      filename = 'products.csv';
    } else if (sampleType === 'events') {
      filename = 'events.jsonl';
    } else {
      throw new Error(`Unknown sample type: ${sampleType}`);
    }
    
    const response = await fetch(`/sample-data/${filename}`);
    
    if (!response.ok) {
      throw new Error('Failed to load sample data');
    }
    
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    
    // Upload the file
    await handleFileUpload(file);
  } catch (error) {
    displayError(error instanceof Error ? error.message : 'Failed to load sample data');
  }
}
