let currentQuestion = null;
let gameQuestions = [];
let currentQuestionIndex = 0;
let currentGameId = null;
let userAnswers = [];
let keyboardListenerActive = false;

async function startGame(gameId) {
    if (localStorage.getItem('debug') === '1') {
        console.log('startGame');
    }
    currentGameId = gameId || currentGameId;
    console.log('Starting game with ID:', currentGameId);
    
    // Use localStorage for timing
    const startTime = Date.now();
    localStorage.setItem('gameStartTime', startTime.toString());
    localStorage.setItem('gameId', currentGameId);

    
    // Clear previous answers
    userAnswers = [];
    
    try {
        // Use dataService to get questions
        const questionsData = await window.dataService.getQuestions(currentGameId);
        gameQuestions = questionsData.slice(0, -1); // Remove timing data

        // Shuffle questions randomly
        gameQuestions = shuffleArray(gameQuestions);
        
        if (gameQuestions && gameQuestions.length > 0) {
            currentQuestionIndex = 0;
            currentQuestion = gameQuestions[currentQuestionIndex];
            displayQuestion(currentQuestion);
        } else {
            console.error('No questions found for theme ID:', currentGameId);
        }
    } catch (error) {
        console.error('Error loading quiz data:', error);

        await loadQuestionsDirectly();
    }
}

async function loadQuestionsDirectly() {
    if (localStorage.getItem('debug') === '1') {
        console.log('loadQuestionsDirectly');
    }
    try {
        // Find which category contains our theme ID
        const categoriesData = await window.dataService.loadJSON('quiz/index.json');
        let categoryFolder = null;
        let selectedTheme = null;
        
        // Search through all categories to find the theme
        for (const category of categoriesData.categories) {
            try {
                const themesData = await window.dataService.loadJSON(`quiz/${category.folder || category.ID}/main.json`);
                const theme = themesData.themes.find(theme => theme.ID == currentGameId);
                if (theme) {
                    selectedTheme = theme;
                    categoryFolder = category.folder || category.ID;
                    break;
                }
            } catch (error) {
                console.warn(`Could not load themes for category ${category.ID}:`, error);
            }
        }
        
        if (!selectedTheme || !categoryFolder) {
            console.error('Theme not found for ID:', currentGameId);
            return;
        }
        
        // Load the correct JSON file
        const response = await fetch(`quiz/${categoryFolder}/${selectedTheme.file}`);
        const data = await response.json();
        gameQuestions = data.questions;
        
        // Shuffle questions randomly
        gameQuestions = shuffleArray(gameQuestions);
        
        if (gameQuestions && gameQuestions.length > 0) {
            currentQuestionIndex = 0;
            currentQuestion = gameQuestions[currentQuestionIndex];
            displayQuestion(currentQuestion);
        }
    } catch (error) {
        console.error('Error loading questions directly:', error);
    }
}

// Add keyboard event listener
function setupKeyboardListeners() {
    // Remove existing listener if any
    document.removeEventListener('keydown', handleKeyPress);
    // Add new listener
    document.addEventListener('keydown', handleKeyPress);
    keyboardListenerActive = true;
}

function removeKeyboardListeners() {
    document.removeEventListener('keydown', handleKeyPress);
    keyboardListenerActive = false;
}

function handleKeyPress(event) {
    if (!keyboardListenerActive) return;
    
    const key = event.key;
    
    // Handle number keys for options (1, 2, 3, 4, etc.)
    if (key >= '1' && key <= '9') {
        const optionNumber = parseInt(key);
        if (currentQuestion && currentQuestion.options && optionNumber <= currentQuestion.options.length) {
            // Check if buttons are still enabled (haven't answered yet)
            const optionBtns = document.querySelectorAll('.option-btn');
            if (optionBtns.length > 0 && !optionBtns[0].disabled) {
                checkAnswer(optionNumber);
                event.preventDefault();
            }
        }
    }
    
    // Handle Enter key for next question
    if (key === 'Enter') {
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.click();
            event.preventDefault();
        }
    }
    
    // Handle Escape key to go to main menu
    if (key === 'Escape') {
        if (confirm('Er du sikker på at du vil gå tilbake til hovedsiden? Fremgangen din vil gå tapt.')) {
            removeKeyboardListeners();
            start();
        }
        event.preventDefault();
    }
}

// Add this new function to shuffle the array
function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid modifying original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// We got ok from user to show YT?
function hasYouTubeConsent() {
    return localStorage.getItem('youtubeConsent') === 'true';
}

// Set YouTube consent
function setYouTubeConsent(allowed) {
    localStorage.setItem('youtubeConsent', allowed.toString());
}

// Handle YouTube Ok
function acceptYouTubeConsent(videoId, containerId) {
    setYouTubeConsent(true);
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = renderYouTubeEmbed(videoId);
    }
}

// Render YouTube
function renderYouTubeEmbed(videoId) {
    return `
        <iframe 
            class="question-youtube" 
            src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
    `;
}

// YouTube video ID from URL
function extractYouTubeId(url) {
    let videoId = url;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
        videoId = match ? match[1] : videoId;
    }
    return videoId;
}

// Main meda function
function renderMedia(question) {
    if (!question.media) return '';
    
    let mediaHtml = '<div class="media-container">';
    
    if (question.media.type === 'image') {
        mediaHtml += `<img src="${question.media.url}" alt="${question.media.alt || 'Question image'}" class="question-image">`;
        if (question.media.caption) {
            mediaHtml += `<p class="media-caption">${question.media.caption}</p>`;
        }
    } else if (question.media.type === 'video') {
        mediaHtml += `
            <video controls class="question-video">
                <source src="${question.media.url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
        if (question.media.caption) {
            mediaHtml += `<p class="media-caption">${question.media.caption}</p>`;
        }
    } else if (question.media.type === 'youtube') {
        const videoId = extractYouTubeId(question.media.url);
        const containerId = `youtube-container-${currentQuestionIndex}`;
        
        if (hasYouTubeConsent()) {
            // User has already consented, show the video
            mediaHtml += `<div id="${containerId}">${renderYouTubeEmbed(videoId)}</div>`;
        } else {
            // Ask for consent
            mediaHtml += `
                <div id="${containerId}" class="youtube-consent-box">
                    <div class="consent-content">
                        <h3>🎥 YouTube-video</h3>
                        <p>Denne quizen inneholder en YouTube-video. For å vise videoer fra YouTube må vi be om ditt samtykke.</p>
                        <p><strong>Tillater du at denne nettsiden viser YouTube-videoer?</strong></p>
                        <p class="consent-note">YouTube kan samle inn data om deg. Du kan endre dette valget senere.</p>
                        <div class="consent-buttons">
                            <button class="consent-btn consent-accept" onclick="acceptYouTubeConsent('${videoId}', '${containerId}')">
                                ✓ Ja, tillat YouTube-videoer
                            </button>
                            <button class="consent-btn consent-decline" onclick="declineYouTubeConsent('${videoId}', '${containerId}')">
                                ✗ Nei, vis bare lenke
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (question.media.caption) {
            mediaHtml += `<p class="media-caption">${question.media.caption}</p>`;
        }
    }
    
    mediaHtml += '</div>';
    return mediaHtml;
}

// Handle YouTube consent womp womp
function declineYouTubeConsent(videoId, containerId) {
    setYouTubeConsent(false);
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="youtube-link-box">
                <p>Se videoen på YouTube:</p>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="youtube-link">
                    Åpne YouTube-video i ny fane
                </a>
                <p class="consent-change">
                    <button class="consent-change-btn" onclick="openConsentSettings()">Endre samtykkeinnstillinger</button>
                </p>
            </div>
        `;
    }
}

// Open consent settings dialog
function openConsentSettings() {
    const currentConsent = hasYouTubeConsent();
    const dialog = document.createElement('div');
    dialog.className = 'consent-settings-overlay';
    dialog.innerHTML = `
        <div class="consent-settings-dialog">
            <h2>Samtykkeinnstillinger</h2>
            <div class="consent-setting-item">
                <h3>YouTube-videoer</h3>
                <p>Tillater nettsiden å vise innebygde YouTube-videoer.</p>
                <p><strong>Nåværende status:</strong> ${currentConsent ? 'Tillatt' : 'Ikke tillatt'}</p>
                <div class="consent-buttons">
                    <button class="consent-btn consent-accept" onclick="updateConsentAndReload(true)">
                        Tillat YouTube-videoer
                    </button>
                    <button class="consent-btn consent-decline" onclick="updateConsentAndReload(false)">
                        ✗ 
Ikke tillat
                    </button>
                </div>
            </div>
            <button class="consent-close-btn" onclick="closeConsentSettings()">Lukk</button>
        </div>
    `;
    document.body.appendChild(dialog);
}

// Update consent and reload question
function updateConsentAndReload(allowed) {
    setYouTubeConsent(allowed);
    closeConsentSettings();
    // Reload the current question to reflect the new consent
    displayQuestion(currentQuestion);
}

// Close consent settings dialog
function closeConsentSettings() {
    const overlay = document.querySelector('.consent-settings-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function displayQuestion(question) {
    if (localStorage.getItem('debug') === '1') {
        console.log('displayQuestion');
    }
    const main = document.getElementById('main');
    
    // Setup keyboard listeners when displaying a question
    setupKeyboardListeners();
    
    let optionsHtml = '';
    question.options.forEach((option, index) => {
        const keyNumber = index + 1;
        optionsHtml += `
            <button class="option-btn" onclick="checkAnswer(${keyNumber})" data-key="${keyNumber}">
                <span class="option-key">${keyNumber}</span>: ${option}
            </button>
        `;
    });
    
    const mediaHtml = renderMedia(question);
    
    main.innerHTML = `
        <div class="top2">
            <div class="statement">${question.qn}</div>
            ${mediaHtml}
        </div>
        <div class="options-container">
            ${optionsHtml}

        </div>
        <div class="feedback-container" id="feedback"></div>
        <div class="bottom">
            Spørsmål ${currentQuestionIndex + 1} av ${gameQuestions.length}
            <div class="keyboard-hint">Bruk tastene 1-${question.options.length} for å svare, Enter for neste</div>
        </div>
    `;
}

function checkAnswer(userChoice) {
    if (localStorage.getItem('debug') === '1') {
        console.log('checkAnswer');
    }
    const isCorrect = userChoice === currentQuestion.answer;
    
    // Disable all option buttons
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    });
    
    // Highlight the selected answer
    const selectedBtn = optionBtns[userChoice - 1];
    if (isCorrect) {
        // Correct answer: blue outline and green background
        selectedBtn.style.border = '4px solid #78dffa';
        selectedBtn.style.backgroundColor = '#2a652f';
        selectedBtn.style.color = 'white';
    } else {
        // Wrong answer: blue outline and red background
        selectedBtn.style.border = '4px solid #78dffa';
        selectedBtn.style.backgroundColor = '#8a3d3d';
        selectedBtn.style.color = 'white';

        // Also highlight the correct answer in green
        const correctBtn = optionBtns[currentQuestion.answer - 1];
        correctBtn.style.backgroundColor = '#2a652f';
        correctBtn.style.color = 'white';
    }
    
    // Store user answer
    userAnswers.push({
        questionId: currentQuestion.qnID,
        questionText: currentQuestion.qn,
        userChoice,
        correctAnswer: currentQuestion.answer,
        correctText: currentQuestion.options[currentQuestion.answer - 1],
        userText: currentQuestion.options[userChoice - 1],
        isCorrect,
        explanation: currentQuestion.explanation
    });
    
    // Show feedback
    showFeedback(isCorrect, userChoice);
}


function showFeedback(correct, userChoice) {
    if (localStorage.getItem('debug') === '1') {
        console.log('showFeedback');
    }
    const feedbackDiv = document.getElementById('feedback');
    const correctAnswer = currentQuestion.answer;
    const correctText = currentQuestion.options[correctAnswer - 1];
    
    if (correct) {
        feedbackDiv.innerHTML = `
            <div class="feedback correct">
                <h3>Riktig!</h3>
                <p>${currentQuestion.explanation}</p>
                <button class="next-btn" onclick="${currentQuestionIndex < gameQuestions.length - 1 ? 'nextQuestion()' : 'endGame()'}">
                    ${currentQuestionIndex < gameQuestions.length - 1 ? 'Neste' : 'Ferdig'} <span class="key-hint">(Enter)</span>
                </button>
            </div>
        `;
    } else {
        feedbackDiv.innerHTML = `
            <div class="feedback incorrect">
                <h3>Galt :(</h3>
                <p>Det riktige svaret er ${correctAnswer}: ${correctText}</p>
                <p>${currentQuestion.explanation}</p>
                <button class="next-btn" onclick="${currentQuestionIndex < gameQuestions.length - 1 ? 'nextQuestion()' : 'endGame()'}">
                    ${currentQuestionIndex < gameQuestions.length - 1 ? 'Neste' : 'Ferdig'} <span class="key-hint">(Enter)</span>
                </button>
            </div>
        `;
    }
}

function nextQuestion() {
    if (localStorage.getItem('debug') === '1') {
        console.log('nextQuestion');
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < gameQuestions.length) {
        currentQuestion = gameQuestions[currentQuestionIndex];
        displayQuestion(currentQuestion);
    } else {
        endGame();
    }
}

function endGame() {
    if (localStorage.getItem('debug') === '1') {
        console.log('endGame');
    }
    
    // Remove keyboard listeners when game ends
    removeKeyboardListeners();
    
    const endTime = Date.now();
    const startTime = parseInt(localStorage.getItem('gameStartTime'));
    const duration = endTime - startTime;
    
    const correct = userAnswers.filter(answer => answer.isCorrect).length;
    const total = userAnswers.length;
    

    // Generate summary HTML
    let summaryHtml = `
        <div class="top4">
            <div class="title">Spill ferdig!</div>
            <div class="text">Du fikk ${correct} av ${total} riktige</div>
            <div class="text">Tid brukt: ${Math.round(duration / 1000)} sekunder</div>

            <div id="result">
    `;
    
    // Add each question summary
    userAnswers.forEach((answer, index) => {
        const questionNumber = index + 1;
        
        summaryHtml += `
            <div class="question-summary">
                <div class="question-text">${questionNumber}. ${answer.questionText}</div>
                <div class="answer-details">
                    <span>Riktig svar: ${answer.correctAnswer}. ${answer.correctText}</span>
                    <span>Du svarte: ${answer.userChoice}. ${answer.userText}</span>
                </div>
                <div class="explanation">${answer.explanation}</div>
                <div class="result-icon">
                    <img src="icon/cor${answer.isCorrect ? '1' : '0'}.svg" alt="checkmark" width="24px">
                </div>
            </div>
        `;
    });
    
    summaryHtml += `
            </div>
        </div>
        <div class="low2">
            <button class="btnfin" onclick="start()">Hovedside</button>
        </div>
    `;
    
    document.getElementById("main").innerHTML = summaryHtml;
    
    // Clear game data
    localStorage.removeItem('gameStartTime');
    localStorage.removeItem('gameResults');
}