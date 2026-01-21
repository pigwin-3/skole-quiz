// Handle URL parameters to navigate directly to a quiz
function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('quiz');
    const categoryId = params.get('category');
    
    if (localStorage.getItem('debug') === '1') {
        console.log('URL Params - quiz:', quizId, 'category:', categoryId);
    }
    
    // If quiz parameter is present, navigate to the quiz start screen (player still needs to click Start spill)
    if (quizId) {
        // Set a small delay to ensure the page has loaded
        setTimeout(() => {
            game(quizId);
        }, 100);
    }
    // If category parameter is present, navigate to themes for that category
    else if (categoryId) {
        // Set a small delay to ensure the page has loaded
        setTimeout(() => {
            themeGet(categoryId);
        }, 100);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', handleUrlParams);
