// Data storage
let categories = [];
let themes = [];
let questions = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await autoLoadData();
    renderAll();
});

// Auto-load data from standard file structure
async function autoLoadData() {
    // Check if data already exists in localStorage
    const hasData = localStorage.getItem('quiz-categories') || 
                    localStorage.getItem('quiz-themes') || 
                    localStorage.getItem('quiz-questions');
    
    if (hasData) {
        loadFromLocalStorage();
        console.log('Data lastet fra localStorage');
        return;
    }
    
    console.log('Laster data automatisk fra filer...');
    
    try {
        // Load index.json (categories)
        const indexResponse = await fetch('../quiz/index.json');
        if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            categories = indexData.categories || [];
            console.log('Kategorier lastet:', categories.length);
            
            // Load themes from each category
            for (const category of categories) {
                try {
                    const mainResponse = await fetch(`../quiz/${category.folder}/main.json`);
                    if (mainResponse.ok) {
                        const mainData = await mainResponse.json();
                        if (mainData.themes) {
                            themes.push(...mainData.themes);
                            console.log(`Temaer lastet fra ${category.folder}:`, mainData.themes.length);
                            
                            // Load questions from each theme
                            for (const theme of mainData.themes) {
                                try {
                                    const questionResponse = await fetch(`../quiz/${category.folder}/${theme.file}`);
                                    if (questionResponse.ok) {
                                        const questionData = await questionResponse.json();
                                        if (questionData.questions) {
                                            questions.push(...questionData.questions);
                                            console.log(`Spørsmål lastet fra ${theme.file}:`, questionData.questions.length);
                                        }
                                    }
                                } catch (error) {
                                    console.warn(`Kunne ikke laste ${theme.file}:`, error);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Kunne ikke laste main.json for ${category.folder}:`, error);
                }
            }
            
            // Save to localStorage
            saveToLocalStorage();
            console.log('All data lastet og lagret!');
            console.log(`Total: ${categories.length} kategorier, ${themes.length} temaer, ${questions.length} spørsmål`);
        }
    } catch (error) {
        console.error('Feil ved automatisk innlasting:', error);
        console.log('Du kan manuelt importere filer fra "Importer Data" fanen');
    }
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Render the active tab
    if (tabName === 'categories') renderCategories();
    if (tabName === 'themes') renderThemes();
}

// ==================== CATEGORIES ====================

function renderCategories() {
    const list = document.getElementById('categories-list');
    if (categories.length === 0) {
        list.innerHTML = '<p class="empty-state">Ingen kategorier ennå. Klikk "+ Ny Kategori" for å legge til.</p>';
        return;
    }
    
    list.innerHTML = categories.map((cat, index) => `
        <div class="item-card">
            <div class="item-header">
                <h3>${cat.Name}</h3>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="editCategory(${index})">Rediger</button>
                    <button class="btn btn-small btn-danger" onclick="deleteCategory(${index})">Slett</button>
                </div>
            </div>
            <div class="item-body">
                <p><strong>ID:</strong> ${cat.ID}</p>
                <p><strong>Mappe:</strong> ${cat.folder}</p>
                <p><strong>Om:</strong> ${cat.about}</p>
            </div>
        </div>
    `).join('');
}

function addCategory() {
    showModal('Ny Kategori', `
        <form onsubmit="saveCategory(event)">
            <div class="form-group">
                <label>Kategori ID (brukes i filsystemet):</label>
                <input type="text" id="cat-id" required placeholder="f.eks. miljoe_og_natur">
            </div>
            <div class="form-group">
                <label>Navn:</label>
                <input type="text" id="cat-name" required placeholder="f.eks. Miljø og Natur">
            </div>
            <div class="form-group">
                <label>Mappe:</label>
                <input type="text" id="cat-folder" required placeholder="f.eks. miljoe_og_natur">
            </div>
            <div class="form-group">
                <label>Beskrivelse:</label>
                <textarea id="cat-about" required placeholder="Kort beskrivelse av kategorien"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Lagre Kategori</button>
        </form>
    `);
}

function editCategory(index) {
    const cat = categories[index];
    showModal('Rediger Kategori', `
        <form onsubmit="updateCategory(event, ${index})">
            <div class="form-group">
                <label>Kategori ID:</label>
                <input type="text" id="cat-id" value="${cat.ID}" required>
            </div>
            <div class="form-group">
                <label>Navn:</label>
                <input type="text" id="cat-name" value="${cat.Name}" required>
            </div>
            <div class="form-group">
                <label>Mappe:</label>
                <input type="text" id="cat-folder" value="${cat.folder}" required>
            </div>
            <div class="form-group">
                <label>Beskrivelse:</label>
                <textarea id="cat-about" required>${cat.about}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Oppdater Kategori</button>
        </form>
    `);
}

function saveCategory(e) {
    e.preventDefault();
    const category = {
        ID: document.getElementById('cat-id').value,
        Name: document.getElementById('cat-name').value,
        about: document.getElementById('cat-about').value,
        folder: document.getElementById('cat-folder').value
    };
    categories.push(category);
    saveToLocalStorage();
    closeModal();
    renderCategories();
    updateDropdowns();
}

function updateCategory(e, index) {
    e.preventDefault();
    categories[index] = {
        ID: document.getElementById('cat-id').value,
        Name: document.getElementById('cat-name').value,
        about: document.getElementById('cat-about').value,
        folder: document.getElementById('cat-folder').value
    };
    saveToLocalStorage();
    closeModal();
    renderCategories();
    updateDropdowns();
}

function deleteCategory(index) {
    if (confirm('Er du sikker på at du vil slette denne kategorien?')) {
        categories.splice(index, 1);
        saveToLocalStorage();
        renderCategories();
        updateDropdowns();
    }
}

function downloadCategories() {
    const data = { categories };
    downloadJSON(data, 'index.json');
}

// ==================== THEMES ====================

function renderThemes() {
    updateDropdowns();
    const filter = document.getElementById('theme-category-filter').value;
    const filtered = filter ? themes.filter(t => t.categoryID === filter) : themes;
    
    const list = document.getElementById('themes-list');
    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-state">Ingen temaer ennå. Klikk "+ Nytt Tema" for å legge til.</p>';
        return;
    }
    
    list.innerHTML = filtered.map((theme, index) => {
        const realIndex = themes.indexOf(theme);
        const category = categories.find(c => c.ID === theme.categoryID);
        const themeQuestions = questions.filter(q => q.themeID == theme.ID);
        return `
            <div class="item-card">
                <div class="item-header">
                    <h3>${theme.Name}</h3>
                    <div class="item-actions">
                        <button class="btn btn-small" onclick="openThemeQuestions(${realIndex})">Spørsmål (${themeQuestions.length})</button>
                        <button class="btn btn-small" onclick="editTheme(${realIndex})">Rediger</button>
                        <button class="btn btn-small btn-danger" onclick="deleteTheme(${realIndex})">Slett</button>
                    </div>
                </div>
                <div class="item-body">
                    <p><strong>ID:</strong> ${theme.ID}</p>
                    <p><strong>Kategori:</strong> ${category ? category.Name : theme.categoryID}</p>
                    <p><strong>Fil:</strong> ${theme.file}</p>
                    <p><strong>Om:</strong> ${theme.about}</p>
                </div>
            </div>
        `;
    }).join('');
}

function addTheme() {
    if (categories.length === 0) {
        alert('Du må legge til minst én kategori først!');
        return;
    }
    
    const catOptions = categories.map(c => `<option value="${c.ID}">${c.Name}</option>`).join('');
    
    showModal('Nytt Tema', `
        <form onsubmit="saveTheme(event)">
            <div class="form-group">
                <label>Tema ID (nummer):</label>
                <input type="number" id="theme-id" required placeholder="f.eks. 3">
            </div>
            <div class="form-group">
                <label>Kategori:</label>
                <select id="theme-category" required>
                    ${catOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Navn:</label>
                <input type="text" id="theme-name" required placeholder="f.eks. Radioaktivitet">
            </div>
            <div class="form-group">
                <label>Beskrivelse:</label>
                <textarea id="theme-about" required placeholder="Test din kunnskap om..."></textarea>
            </div>
            <div class="form-group">
                <label>Filnavn (for spørsmålene):</label>
                <input type="text" id="theme-file" required placeholder="f.eks. radioaktivitet.json">
            </div>
            <div class="form-group">
                <label>Antall spørsmål:</label>
                <input type="number" id="theme-qn" value="0" required>
            </div>
            <button type="submit" class="btn btn-primary">Lagre Tema</button>
        </form>
    `);
}

function editTheme(index) {
    const theme = themes[index];
    const catOptions = categories.map(c => 
        `<option value="${c.ID}" ${c.ID === theme.categoryID ? 'selected' : ''}>${c.Name}</option>`
    ).join('');
    
    showModal('Rediger Tema', `
        <form onsubmit="updateTheme(event, ${index})">
            <div class="form-group">
                <label>Tema ID:</label>
                <input type="number" id="theme-id" value="${theme.ID}" required>
            </div>
            <div class="form-group">
                <label>Kategori:</label>
                <select id="theme-category" required>
                    ${catOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Navn:</label>
                <input type="text" id="theme-name" value="${theme.Name}" required>
            </div>
            <div class="form-group">
                <label>Beskrivelse:</label>
                <textarea id="theme-about" required>${theme.about}</textarea>
            </div>
            <div class="form-group">
                <label>Filnavn:</label>
                <input type="text" id="theme-file" value="${theme.file}" required>
            </div>
            <div class="form-group">
                <label>Antall spørsmål:</label>
                <input type="number" id="theme-qn" value="${theme.qn}" required>
            </div>
            <button type="submit" class="btn btn-primary">Oppdater Tema</button>
        </form>
    `);
}

function saveTheme(e) {
    e.preventDefault();
    const theme = {
        ID: parseInt(document.getElementById('theme-id').value),
        categoryID: document.getElementById('theme-category').value,
        Name: document.getElementById('theme-name').value,
        about: document.getElementById('theme-about').value,
        qn: parseInt(document.getElementById('theme-qn').value),
        file: document.getElementById('theme-file').value
    };
    themes.push(theme);
    saveToLocalStorage();
    closeModal();
    renderThemes();
    updateDropdowns();
}

function updateTheme(e, index) {
    e.preventDefault();
    themes[index] = {
        ID: parseInt(document.getElementById('theme-id').value),
        categoryID: document.getElementById('theme-category').value,
        Name: document.getElementById('theme-name').value,
        about: document.getElementById('theme-about').value,
        qn: parseInt(document.getElementById('theme-qn').value),
        file: document.getElementById('theme-file').value
    };
    saveToLocalStorage();
    closeModal();
    renderThemes();
    updateDropdowns();
}

function deleteTheme(index) {
    if (confirm('Er du sikker på at du vil slette dette temaet?')) {
        themes.splice(index, 1);
        saveToLocalStorage();
        renderThemes();
        updateDropdowns();
    }
}

function filterThemes() {
    renderThemes();
}

function downloadThemes() {
    const categoryID = document.getElementById('theme-download-category').value;
    if (!categoryID) {
        alert('Vennligst velg en kategori');
        return;
    }
    
    const categoryThemes = themes.filter(t => t.categoryID === categoryID);
    const data = { themes: categoryThemes };
    downloadJSON(data, 'main.json');
}

// Open questions editor for a specific theme
function openThemeQuestions(themeIndex) {
    const theme = themes[themeIndex];
    const themeQuestions = questions.filter(q => q.themeID == theme.ID);
    
    let questionsHTML = '';
    if (themeQuestions.length === 0) {
        questionsHTML = '<p class="empty-state">Ingen spørsmål enda for dette temaet.</p>';
    } else {
        questionsHTML = themeQuestions.map(q => {
            const actualIndex = questions.findIndex(quest => quest.qnID === q.qnID && quest.themeID === q.themeID);
            return `
                <div class="question-preview">
                    <div class="question-header">
                        <strong>Q${q.qnID}:</strong> ${q.qn.substring(0, 80)}${q.qn.length > 80 ? '...' : ''}
                        <div>
                            <button class="btn btn-small" onclick="editQuestion(${actualIndex}, ${themeIndex})">Rediger</button>
                            <button class="btn btn-small btn-danger" onclick="deleteQuestion(${actualIndex}, ${themeIndex})">Slett</button>
                        </div>
                    </div>
                    ${q.media ? `<div class="media-badge">${q.media.type}</div>` : ''}
                    <div class="options-preview">${q.options.length} alternativer · Riktig: ${q.answer}</div>
                </div>
            `;
        }).join('');
    }
    
    showModal(`Spørsmål: ${theme.Name}`, `
        <div class="theme-questions-container">
            <div class="question-controls">
                <button class="btn btn-primary" onclick="addQuestion(${themeIndex})">+ Nytt Spørsmål</button>
                <button class="btn btn-success" onclick="downloadThemeQuestions(${themeIndex})">⬇ Last ned ${theme.file}</button>
            </div>
            <div class="questions-grid">
                ${questionsHTML}
            </div>
        </div>
    `);
}

function downloadThemeQuestions(themeIndex) {
    const theme = themes[themeIndex];
    const themeQuestions = questions.filter(q => q.themeID == theme.ID);
    const data = { questions: themeQuestions };
    downloadJSON(data, theme.file);
}

// ==================== QUESTIONS ====================

function addQuestion(themeIndex = null) {
    if (themes.length === 0) {
        alert('Du må legge til minst ett tema først!');
        return;
    }
    
    const selectedTheme = themeIndex !== null ? themes[themeIndex] : null;
    
    // Auto-generate question ID (highest ID + 1 for this theme)
    let nextQID = 1;
    if (selectedTheme) {
        const themeQuestions = questions.filter(q => q.themeID == selectedTheme.ID);
        if (themeQuestions.length > 0) {
            const maxID = Math.max(...themeQuestions.map(q => q.qnID));
            nextQID = maxID + 1;
        }
    }
    
    showModal('Nytt Spørsmål' + (selectedTheme ? ` - ${selectedTheme.Name}` : ''), `
        <form onsubmit="saveQuestion(event, ${themeIndex})" class="question-form">
            <div class="form-group">
                <label>Spørsmål ID (auto-generert):</label>
                <input type="number" id="q-id" value="${nextQID}" required readonly style="background: #1a1a1a; cursor: not-allowed;">
            </div>
            ${selectedTheme ? `
                <input type="hidden" id="q-theme" value="${selectedTheme.ID}">
                <div class="form-group">
                    <label>Tema:</label>
                    <input type="text" value="${selectedTheme.Name}" disabled>
                </div>
            ` : `
                <div class="form-group">
                    <label>Tema:</label>
                    <select id="q-theme" required>
                        ${themes.map(t => `<option value="${t.ID}">${t.Name}</option>`).join('')}
                    </select>
                </div>
            `}
            <div class="form-group">
                <label>Spørsmål:</label>
                <textarea id="q-text" required placeholder="Skriv spørsmålet her..."></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="q-has-media" onchange="toggleMediaFields()">
                    Legg til media (bilde/video/YouTube)
                </label>
            </div>
            
            <div id="media-fields" style="display: none;">
                <div class="form-group">
                    <label>Media Type:</label>
                    <select id="q-media-type">
                        <option value="image">Bilde</option>
                        <option value="video">Video</option>
                        <option value="youtube">YouTube</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Media URL:</label>
                    <input type="text" id="q-media-url" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label>Alt-tekst (valgfritt, for bilder):</label>
                    <input type="text" id="q-media-alt" placeholder="Beskrivelse av bildet">
                </div>
                <div class="form-group">
                    <label>Bildetekst (valgfritt):</label>
                    <input type="text" id="q-media-caption" placeholder="Tekst under media">
                </div>
            </div>
            
            <div class="form-group">
                <label>Antall alternativer:</label>
                <input type="number" id="q-num-options" min="2" max="10" value="4" onchange="updateOptionsFields()">
            </div>
            
            <div id="options-container">
                <div class="form-group">
                    <label>Alternativ 1:</label>
                    <input type="text" class="option-input" data-index="1" required>
                </div>
                <div class="form-group">
                    <label>Alternativ 2:</label>
                    <input type="text" class="option-input" data-index="2" required>
                </div>
                <div class="form-group">
                    <label>Alternativ 3:</label>
                    <input type="text" class="option-input" data-index="3" required>
                </div>
                <div class="form-group">
                    <label>Alternativ 4:</label>
                    <input type="text" class="option-input" data-index="4" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Riktig svar (nummer):</label>
                <input type="number" id="q-answer" min="1" max="4" required>
            </div>
            <div class="form-group">
                <label>Forklaring:</label>
                <textarea id="q-explanation" required placeholder="Forklar hvorfor svaret er riktig..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Lagre Spørsmål</button>
        </form>
    `);
    
    // Set up initial options fields
    setTimeout(() => updateOptionsFields(), 100);
}

function toggleMediaFields() {
    const hasMedia = document.getElementById('q-has-media').checked;
    document.getElementById('media-fields').style.display = hasMedia ? 'block' : 'none';
}

function updateOptionsFields() {
    const numOptions = parseInt(document.getElementById('q-num-options').value);
    const container = document.getElementById('options-container');
    const answerInput = document.getElementById('q-answer');
    
    // Update max value for answer input
    answerInput.max = numOptions;
    if (parseInt(answerInput.value) > numOptions) {
        answerInput.value = numOptions;
    }
    
    // Get existing values
    const existingValues = Array.from(container.querySelectorAll('.option-input')).map(input => input.value);
    
    // Clear and rebuild
    container.innerHTML = '';
    for (let i = 1; i <= numOptions; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label>Alternativ ${i}:</label>
            <input type="text" class="option-input" data-index="${i}" value="${existingValues[i-1] || ''}" required>
        `;
        container.appendChild(div);
    }
}

function editQuestion(index, themeIndex = null) {
    const q = questions[index];
    const selectedTheme = themeIndex !== null ? themes[themeIndex] : themes.find(t => t.ID == q.themeID);
    
    const hasMedia = !!q.media;
    const numOptions = q.options.length;
    
    showModal('Rediger Spørsmål' + (selectedTheme ? ` - ${selectedTheme.Name}` : ''), `
        <form onsubmit="updateQuestion(event, ${index}, ${themeIndex})" class="question-form">
            <div class="form-group">
                <label>Spørsmål ID:</label>
                <input type="number" id="q-id" value="${q.qnID}" required>
            </div>
            ${selectedTheme ? `
                <input type="hidden" id="q-theme" value="${selectedTheme.ID}">
                <div class="form-group">
                    <label>Tema:</label>
                    <input type="text" value="${selectedTheme.Name}" disabled>
                </div>
            ` : `
                <div class="form-group">
                    <label>Tema:</label>
                    <select id="q-theme" required>
                        ${themes.map(t => `<option value="${t.ID}" ${t.ID == q.themeID ? 'selected' : ''}>${t.Name}</option>`).join('')}
                    </select>
                </div>
            `}
            <div class="form-group">
                <label>Spørsmål:</label>
                <textarea id="q-text" required>${q.qn}</textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="q-has-media" ${hasMedia ? 'checked' : ''} onchange="toggleMediaFields()">
                    Legg til media (bilde/video/YouTube)
                </label>
            </div>
            
            <div id="media-fields" style="display: ${hasMedia ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Media Type:</label>
                    <select id="q-media-type">
                        <option value="image" ${hasMedia && q.media.type === 'image' ? 'selected' : ''}>Bilde</option>
                        <option value="video" ${hasMedia && q.media.type === 'video' ? 'selected' : ''}>Video</option>
                        <option value="youtube" ${hasMedia && q.media.type === 'youtube' ? 'selected' : ''}>YouTube</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Media URL:</label>
                    <input type="text" id="q-media-url" value="${hasMedia ? q.media.url : ''}" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label>Alt-tekst (valgfritt, for bilder):</label>
                    <input type="text" id="q-media-alt" value="${hasMedia && q.media.alt ? q.media.alt : ''}" placeholder="Beskrivelse av bildet">
                </div>
                <div class="form-group">
                    <label>Bildetekst (valgfritt):</label>
                    <input type="text" id="q-media-caption" value="${hasMedia && q.media.caption ? q.media.caption : ''}" placeholder="Tekst under media">
                </div>
            </div>
            
            <div class="form-group">
                <label>Antall alternativer:</label>
                <input type="number" id="q-num-options" min="2" max="10" value="${numOptions}" onchange="updateOptionsFields()">
            </div>
            
            <div id="options-container">
                ${q.options.map((opt, i) => `
                    <div class="form-group">
                        <label>Alternativ ${i + 1}:</label>
                        <input type="text" class="option-input" data-index="${i + 1}" value="${opt}" required>
                    </div>
                `).join('')}
            </div>
            
            <div class="form-group">
                <label>Riktig svar (nummer):</label>
                <input type="number" id="q-answer" min="1" max="${numOptions}" value="${q.answer}" required>
            </div>
            <div class="form-group">
                <label>Forklaring:</label>
                <textarea id="q-explanation" required>${q.explanation}</textarea>
            </div>
            <button type="submit" class="btn btn-primary">Oppdater Spørsmål</button>
        </form>
    `);
}

function saveQuestion(e, themeIndex = null) {
    e.preventDefault();
    
    // Collect all option values
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs).map(input => input.value);
    
    const question = {
        qnID: parseInt(document.getElementById('q-id').value),
        themeID: document.getElementById('q-theme').value,
        qn: document.getElementById('q-text').value,
        options: options,
        answer: parseInt(document.getElementById('q-answer').value),
        explanation: document.getElementById('q-explanation').value
    };
    
    // Add media if checkbox is checked
    if (document.getElementById('q-has-media').checked) {
        const mediaUrl = document.getElementById('q-media-url').value;
        if (mediaUrl) {
            question.media = {
                type: document.getElementById('q-media-type').value,
                url: mediaUrl
            };
            
            const alt = document.getElementById('q-media-alt').value;
            const caption = document.getElementById('q-media-caption').value;
            
            if (alt) question.media.alt = alt;
            if (caption) question.media.caption = caption;
        }
    }
    
    questions.push(question);
    saveToLocalStorage();
    closeModal();
    
    // If we're in a theme view, reopen it
    if (themeIndex !== null) {
        openThemeQuestions(themeIndex);
    }
}

function updateQuestion(e, index, themeIndex = null) {
    e.preventDefault();
    
    // Collect all option values
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs).map(input => input.value);
    
    const question = {
        qnID: parseInt(document.getElementById('q-id').value),
        themeID: document.getElementById('q-theme').value,
        qn: document.getElementById('q-text').value,
        options: options,
        answer: parseInt(document.getElementById('q-answer').value),
        explanation: document.getElementById('q-explanation').value
    };
    
    // Add media if checkbox is checked
    if (document.getElementById('q-has-media').checked) {
        const mediaUrl = document.getElementById('q-media-url').value;
        if (mediaUrl) {
            question.media = {
                type: document.getElementById('q-media-type').value,
                url: mediaUrl
            };
            
            const alt = document.getElementById('q-media-alt').value;
            const caption = document.getElementById('q-media-caption').value;
            
            if (alt) question.media.alt = alt;
            if (caption) question.media.caption = caption;
        }
    }
    
    questions[index] = question;
    saveToLocalStorage();
    closeModal();
    
    // If we're in a theme view, reopen it
    if (themeIndex !== null) {
        openThemeQuestions(themeIndex);
    }
}

function deleteQuestion(index, themeIndex = null) {
    if (confirm('Er du sikker på at du vil slette dette spørsmålet?')) {
        questions.splice(index, 1);
        saveToLocalStorage();
        
        // If we're in a theme view, reopen it
        if (themeIndex !== null) {
            openThemeQuestions(themeIndex);
        }
    }
}

// ==================== UTILITIES ====================

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `<h2>${title}</h2>` + content;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function updateDropdowns() {
    // Update category filter for themes
    const themeCatFilter = document.getElementById('theme-category-filter');
    if (themeCatFilter) {
        const currentThemeCat = themeCatFilter.value;
        themeCatFilter.innerHTML = '<option value="">Alle kategorier</option>' +
            categories.map(c => `<option value="${c.ID}">${c.Name}</option>`).join('');
        themeCatFilter.value = currentThemeCat;
    }
    
    // Update category selector for download
    const themeCatDownload = document.getElementById('theme-download-category');
    if (themeCatDownload) {
        themeCatDownload.innerHTML = '<option value="">Velg kategori...</option>' +
            categories.map(c => `<option value="${c.ID}">${c.Name}</option>`).join('');
    }
}

function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveToLocalStorage() {
    localStorage.setItem('quiz-categories', JSON.stringify(categories));
    localStorage.setItem('quiz-themes', JSON.stringify(themes));
    localStorage.setItem('quiz-questions', JSON.stringify(questions));
}

function loadFromLocalStorage() {
    const savedCategories = localStorage.getItem('quiz-categories');
    const savedThemes = localStorage.getItem('quiz-themes');
    const savedQuestions = localStorage.getItem('quiz-questions');
    
    if (savedCategories) categories = JSON.parse(savedCategories);
    if (savedThemes) themes = JSON.parse(savedThemes);
    if (savedQuestions) questions = JSON.parse(savedQuestions);
}

function renderAll() {
    renderCategories();
    renderThemes();
}

// Reload data from files
async function reloadData() {
    if (confirm('Dette vil laste inn alle filer på nytt fra quiz-mappen. Uslagrede endringer går tapt. Fortsette?')) {
        // Clear existing data
        categories = [];
        themes = [];
        questions = [];
        localStorage.removeItem('quiz-categories');
        localStorage.removeItem('quiz-themes');
        localStorage.removeItem('quiz-questions');
        
        // Reload
        await autoLoadData();
        renderAll();
        alert('Data lastet inn på nytt!');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}
