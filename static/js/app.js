// Application State
const state = {
    notes: [],          // Full list of parsed release notes from the backend
    filteredNotes: [],  // Currently filtered release notes (search + categories)
    selectedIds: new Set(), // Set of selected note IDs
    activeCategory: 'all',
    searchQuery: '',
    theme: 'dark'
};

// DOM Elements
const dom = {
    themeToggle: document.getElementById('theme-toggle'),
    themeSunIcon: document.getElementById('theme-sun-icon'),
    themeMoonIcon: document.getElementById('theme-moon-icon'),
    refreshBtn: document.getElementById('refresh-button'),
    refreshSpinner: document.getElementById('refresh-spinner'),
    exportCsvBtn: document.getElementById('export-csv-button'),
    fetchStatus: document.getElementById('fetch-status'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    categoryFilters: document.getElementById('category-filters'),
    notesGrid: document.getElementById('notes-grid'),
    loadingView: document.getElementById('loading-view'),
    emptyView: document.getElementById('empty-view'),
    resetFilters: document.getElementById('reset-filters'),
    
    // Stats
    statTotal: document.getElementById('stat-total'),
    statFeatures: document.getElementById('stat-features'),
    statChanges: document.getElementById('stat-changes'),
    statDeprecations: document.getElementById('stat-deprecations'),
    
    // Selection Bar
    selectionBar: document.getElementById('selection-bar'),
    selectionText: document.getElementById('selection-text'),
    clearSelectionBtn: document.getElementById('clear-selection-btn'),
    tweetSelectionBtn: document.getElementById('tweet-selection-btn'),
    
    // Modal
    composerModal: document.getElementById('composer-modal'),
    closeModal: document.getElementById('close-modal'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalTweetBtn: document.getElementById('modal-tweet-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCountText: document.getElementById('char-count-text'),
    charProgressBar: document.getElementById('char-progress-bar'),
    helperTags: document.querySelectorAll('.helper-tag-btn'),
    
    // Fallback Banner
    fallbackBanner: document.getElementById('fallback-banner'),
    fallbackBannerText: document.getElementById('fallback-banner-text'),
    closeFallbackBanner: document.getElementById('close-fallback-banner')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchReleaseNotes();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    state.theme = savedTheme;
    updateThemeUI();
}

function toggleTheme() {
    state.theme = dom.themeToggle.checked ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    updateThemeUI();
}

function updateThemeUI() {
    if (state.theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        dom.themeToggle.checked = true;
        dom.themeSunIcon.classList.add('active');
        dom.themeMoonIcon.classList.remove('active');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        dom.themeToggle.checked = false;
        dom.themeSunIcon.classList.remove('active');
        dom.themeMoonIcon.classList.add('active');
    }
}

// Event Listeners
function setupEventListeners() {
    // Theme
    dom.themeToggle.addEventListener('change', toggleTheme);
    
    // Refresh
    dom.refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    
    // Export CSV
    dom.exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Search
    dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        dom.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
        applyFilters();
    });
    
    dom.clearSearch.addEventListener('click', () => {
        dom.searchInput.value = '';
        state.searchQuery = '';
        dom.clearSearch.style.display = 'none';
        applyFilters();
        dom.searchInput.focus();
    });
    
    // Category Buttons
    dom.categoryFilters.addEventListener('click', (e) => {
        const target = e.target.closest('.filter-tag');
        if (!target) return;
        
        document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
        target.classList.add('active');
        
        state.activeCategory = target.getAttribute('data-type');
        applyFilters();
    });
    
    // Reset Empty View
    dom.resetFilters.addEventListener('click', () => {
        dom.searchInput.value = '';
        state.searchQuery = '';
        dom.clearSearch.style.display = 'none';
        
        document.querySelectorAll('.filter-tag').forEach(tag => {
            if (tag.getAttribute('data-type') === 'all') tag.classList.add('active');
            else tag.classList.remove('active');
        });
        state.activeCategory = 'all';
        applyFilters();
    });
    
    // Card Selection Clear
    dom.clearSelectionBtn.addEventListener('click', clearSelection);
    
    // Tweet Actions
    dom.tweetSelectionBtn.addEventListener('click', () => openTweetComposer('selected'));
    
    // Modal Close
    dom.closeModal.addEventListener('click', closeComposerModal);
    dom.modalCancelBtn.addEventListener('click', closeComposerModal);
    
    // Modal Character Counting
    dom.tweetTextarea.addEventListener('input', updateCharCount);
    
    // Modal Helpers
    dom.helperTags.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            insertTagAtCursor(tag);
        });
    });
    
    // Modal Post to Twitter/X
    dom.modalTweetBtn.addEventListener('click', postTweet);
    
    // Close Fallback Banner
    dom.closeFallbackBanner.addEventListener('click', () => {
        dom.fallbackBanner.classList.add('hidden');
    });
}

// Fetch Notes from API
async function fetchReleaseNotes(forceRefresh = false) {
    showLoading(true);
    
    // Set status indicator to loading
    dom.fetchStatus.classList.add('loading');
    dom.fetchStatus.querySelector('.status-text').textContent = 'Fetching updates...';
    if (forceRefresh) {
        dom.refreshBtn.classList.add('spinning');
        dom.refreshBtn.disabled = true;
    }
    
    try {
        const url = forceRefresh ? '/api/notes?refresh=true' : '/api/notes';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to retrieve release notes.');
        
        const data = await response.json();
        
        if (data.success) {
            state.notes = data.notes;
            // Update fetch status text
            const timeText = data.last_fetched ? `Refreshed: ${data.last_fetched.split(' ')[1]}` : 'Feed Updated';
            dom.fetchStatus.querySelector('.status-text').textContent = timeText;
            
            // Show fallback banner if using cache fallback
            if (data.fallback) {
                dom.fallbackBannerText.textContent = `Viewing cached updates from ${data.last_fetched}. The official Google Cloud feed is currently unreachable.`;
                dom.fallbackBanner.classList.remove('hidden');
            } else {
                dom.fallbackBanner.classList.add('hidden');
            }
            
            // Clear selection since data reloaded
            clearSelection();
            applyFilters();
        } else {
            console.error('API Error:', data.error);
            dom.fetchStatus.querySelector('.status-text').textContent = 'Error loading feed';
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        dom.fetchStatus.querySelector('.status-text').textContent = 'Connection error';
    } finally {
        showLoading(false);
        dom.fetchStatus.classList.remove('loading');
        if (forceRefresh) {
            dom.refreshBtn.classList.remove('spinning');
            dom.refreshBtn.disabled = false;
        }
    }
}

// Filters & Search logic
function applyFilters() {
    state.filteredNotes = state.notes.filter(note => {
        // Category Filter
        const matchesCategory = state.activeCategory === 'all' || 
            note.type.toLowerCase() === state.activeCategory.toLowerCase();
            
        // Search Filter
        const textContent = (note.text + ' ' + note.type + ' ' + note.date).toLowerCase();
        const matchesSearch = !state.searchQuery || textContent.includes(state.searchQuery);
        
        return matchesCategory && matchesSearch;
    });
    
    updateStats();
    renderNotes();
}

// Update counters
function updateStats() {
    // Total parsed notes
    const total = state.notes.length;
    const features = state.notes.filter(n => n.type.toLowerCase() === 'feature').length;
    const deprecations = state.notes.filter(n => n.type.toLowerCase() === 'deprecation').length;
    const changes = state.notes.filter(n => ['changed', 'resolved'].includes(n.type.toLowerCase())).length;
    
    dom.statTotal.textContent = total;
    dom.statFeatures.textContent = features;
    dom.statChanges.textContent = changes;
    dom.statDeprecations.textContent = deprecations;
}

// Show/Hide loaders
function showLoading(isLoading) {
    if (isLoading) {
        dom.loadingView.classList.remove('hidden');
        dom.notesGrid.classList.add('hidden');
        dom.emptyView.classList.add('hidden');
    } else {
        dom.loadingView.classList.add('hidden');
        dom.notesGrid.classList.remove('hidden');
    }
}

// Render release note cards
function renderNotes() {
    dom.notesGrid.innerHTML = '';
    
    if (state.filteredNotes.length === 0) {
        dom.emptyView.classList.remove('hidden');
        dom.notesGrid.classList.add('hidden');
        return;
    }
    
    dom.emptyView.classList.add('hidden');
    dom.notesGrid.classList.remove('hidden');
    
    state.filteredNotes.forEach(note => {
        const card = document.createElement('div');
        const cleanType = note.type.toLowerCase();
        
        // Setup card classes
        card.className = `release-card category-${cleanType}`;
        card.setAttribute('data-id', note.id);
        
        if (state.selectedIds.has(note.id)) {
            card.classList.add('selected');
        }
        
        // Handle click card to select
        card.addEventListener('click', (e) => {
            // Prevent toggling selection if clicking a link or a button
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            toggleSelection(note.id);
        });
        
        // Define badge style
        let badgeClass = 'badge-general';
        if (['feature', 'changed', 'deprecation', 'resolved'].includes(cleanType)) {
            badgeClass = `badge-${cleanType}`;
        }
        
        const needsToggle = note.text.length > 300;
        let bodyContent = `
            <div class="card-body">
                ${note.html}
            </div>
        `;
        
        if (needsToggle) {
            bodyContent = `
                <div class="card-body-wrapper">
                    <div class="card-body">
                        ${note.html}
                    </div>
                </div>
                <button class="btn-show-more-toggle" aria-label="Toggle full update text">
                    <span>Show More</span>
                    <svg viewBox="0 0 24 24">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                </button>
            `;
        }
        
        card.innerHTML = `
            <div class="card-header-row">
                <div class="card-badge-date">
                    <span class="badge ${badgeClass}">${note.type}</span>
                    <span class="card-date">${note.date}</span>
                </div>
                <div class="card-selection-controls">
                    <div class="checkbox-mock" aria-label="Select update">
                        <svg viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                    </div>
                </div>
            </div>
            
            ${bodyContent}
            
            <div class="card-footer">
                <a class="source-link-btn" href="${note.link}" target="_blank" rel="noopener noreferrer" title="View official Google Cloud Release Notes">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41 9.83-9.83V9h2V3h-6z"/>
                    </svg>
                    <span>Official Release Page</span>
                </a>
                
                <div class="card-action-buttons">
                    <button class="btn btn-copy-quick" title="Copy update details to clipboard">
                        <svg viewBox="0 0 24 24">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy</span>
                    </button>
                    <button class="btn btn-tweet-quick" title="Tweet about this specific update">
                        <svg viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Tweet</span>
                    </button>
                </div>
            </div>
        `;
        
        // Handle show more toggle click
        if (needsToggle) {
            const toggleBtn = card.querySelector('.btn-show-more-toggle');
            const wrapper = card.querySelector('.card-body-wrapper');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = wrapper.classList.toggle('expanded');
                toggleBtn.classList.toggle('expanded', isExpanded);
                toggleBtn.querySelector('span').textContent = isExpanded ? 'Show Less' : 'Show More';
            });
        }
        
        // Handle quick copy button click
        const quickCopyBtn = card.querySelector('.btn-copy-quick');
        quickCopyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const copyText = `[${note.date}] ${note.type}: ${note.text} (Source: ${note.link})`;
            try {
                await navigator.clipboard.writeText(copyText);
                
                // Visual feedback
                quickCopyBtn.classList.add('copied');
                const btnText = quickCopyBtn.querySelector('span');
                const originalText = btnText.textContent;
                btnText.textContent = 'Copied!';
                
                const originalSvgHtml = quickCopyBtn.querySelector('svg').innerHTML;
                quickCopyBtn.querySelector('svg').innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
                
                setTimeout(() => {
                    quickCopyBtn.classList.remove('copied');
                    btnText.textContent = originalText;
                    quickCopyBtn.querySelector('svg').innerHTML = originalSvgHtml;
                }, 2000);
            } catch (err) {
                console.error('Could not copy text: ', err);
            }
        });
        
        // Handle quick tweet button click
        const quickTweetBtn = card.querySelector('.btn-tweet-quick');
        quickTweetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTweetComposer('single', note.id);
        });
        
        dom.notesGrid.appendChild(card);
    });
}

// Selection Bar logic
function toggleSelection(id) {
    if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
    } else {
        state.selectedIds.add(id);
    }
    
    updateSelectionUI();
}

function clearSelection() {
    state.selectedIds.clear();
    updateSelectionUI();
}

function updateSelectionUI() {
    // Toggle active classes on cards
    document.querySelectorAll('.release-card').forEach(card => {
        const cardId = card.getAttribute('data-id');
        if (state.selectedIds.has(cardId)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Update bottom selection bar
    const selectedCount = state.selectedIds.size;
    if (selectedCount > 0) {
        dom.selectionText.textContent = `${selectedCount} update${selectedCount > 1 ? 's' : ''} selected`;
        dom.selectionBar.classList.add('active');
        dom.selectionBar.classList.remove('hidden');
    } else {
        dom.selectionBar.classList.remove('active');
        // Let slide animation finish before hiding element
        setTimeout(() => {
            if (state.selectedIds.size === 0) {
                dom.selectionBar.classList.add('hidden');
            }
        }, 300);
    }
}

// Compose Twitter/X Post Modal
function openTweetComposer(mode, singleId = null) {
    let text = '';
    
    if (mode === 'single') {
        const note = state.notes.find(n => n.id === singleId);
        if (note) {
            text = formatTweet(note);
        }
    } else if (mode === 'selected') {
        const selectedNotes = state.notes.filter(n => state.selectedIds.has(n.id));
        if (selectedNotes.length === 1) {
            text = formatTweet(selectedNotes[0]);
        } else if (selectedNotes.length > 1) {
            // Aggregate multiple updates
            const date = selectedNotes[0].date;
            text = `📢 BigQuery Release Updates [${date}]:\n`;
            selectedNotes.forEach(note => {
                const snippet = note.text.substring(0, 70).replace(/\n/g, ' ');
                text += `• [${note.type}] ${snippet}...\n`;
            });
            text += `\nRead more: ${selectedNotes[0].link}\n#BigQuery #GoogleCloud`;
        }
    }
    
    dom.tweetTextarea.value = text;
    updateCharCount();
    
    dom.composerModal.classList.remove('hidden');
    // Let fade-in trigger
    setTimeout(() => {
        dom.composerModal.classList.add('active');
    }, 10);
}

function formatTweet(note) {
    // Truncate details to fit nicely in 280 characters with other templates
    const header = `📢 BigQuery Release Notes [${note.date}]\nType: ${note.type}\n\n`;
    const footer = `\n\nRead details: ${note.link}\n#BigQuery #GoogleCloud`;
    
    // Available length for description text
    const fixedLength = header.length + footer.length;
    const maxDescLength = 280 - fixedLength - 5; // buffer
    
    let desc = note.text;
    if (desc.length > maxDescLength) {
        desc = desc.substring(0, maxDescLength) + '...';
    }
    
    return `${header}${desc}${footer}`;
}

function closeComposerModal() {
    dom.composerModal.classList.remove('active');
    setTimeout(() => {
        dom.composerModal.classList.add('hidden');
    }, 300);
}

// Character limit and progress ring calculations
function updateCharCount() {
    const text = dom.tweetTextarea.value;
    const length = text.length;
    const limit = 280;
    const remaining = limit - length;
    
    dom.charCountText.textContent = remaining;
    
    // Progress calculation
    const progress = Math.min(length / limit * 100, 100);
    dom.charProgressBar.style.strokeDasharray = `${progress}, 100`;
    
    // Styling states based on character count limits
    if (remaining < 0) {
        dom.charCountText.classList.add('overlimit');
        dom.charProgressBar.className.baseVal = 'char-progress danger';
        dom.modalTweetBtn.disabled = true;
        dom.modalTweetBtn.style.opacity = '0.5';
    } else if (remaining <= 30) {
        dom.charCountText.classList.remove('overlimit');
        dom.charProgressBar.className.baseVal = 'char-progress warning';
        dom.modalTweetBtn.disabled = false;
        dom.modalTweetBtn.style.opacity = '1';
    } else {
        dom.charCountText.classList.remove('overlimit');
        dom.charProgressBar.className.baseVal = 'char-progress';
        dom.modalTweetBtn.disabled = false;
        dom.modalTweetBtn.style.opacity = '1';
    }
}

// Inserting tags at composer text area cursor location
function insertTagAtCursor(tag) {
    const textarea = dom.tweetTextarea;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const oldText = textarea.value;
    
    // Add space before tag if not at start and no space exists
    const prefix = (startPos > 0 && oldText[startPos - 1] !== ' ') ? ' ' : '';
    // Add space after tag if text follows and no space exists
    const suffix = (endPos < oldText.length && oldText[endPos] !== ' ') ? ' ' : '';
    
    textarea.value = oldText.substring(0, startPos) + prefix + tag + suffix + oldText.substring(endPos);
    
    // Reposition cursor
    const newCursorPos = startPos + prefix.length + tag.length + suffix.length;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    updateCharCount();
}

// Opens Twitter/X Intent for Posting
function postTweet() {
    const tweetText = dom.tweetTextarea.value;
    const encodedText = encodeURIComponent(tweetText);
    
    // We use the modern x.com share intent
    const shareUrl = `https://x.com/intent/post?text=${encodedText}`;
    
    // Open in a new tab
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    
    closeComposerModal();
    clearSelection();
}

// Export to CSV Functionality
function exportToCSV() {
    if (state.filteredNotes.length === 0) {
        alert('No release notes available to export.');
        return;
    }
    
    const headers = ['Date', 'Type', 'Description', 'Link'];
    const csvRows = [headers.join(',')];
    
    state.filteredNotes.forEach(note => {
        const row = [
            escapeCSVField(note.date),
            escapeCSVField(note.type),
            escapeCSVField(note.text),
            escapeCSVField(note.link)
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const categorySuffix = state.activeCategory !== 'all' ? `_${state.activeCategory}` : '';
    link.setAttribute('download', `bigquery_release_notes_${dateStr}${categorySuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCSVField(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = `"${str}"`;
    }
    return str;
}
