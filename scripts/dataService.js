class DataService {
    constructor() {
        this.cache = {};
    }

    async loadJSON(path) {
        if (localStorage.getItem('debug') === '1') {
            console.log('loadJSON');
        }
        if (this.cache[path]) {
            return this.cache[path];
        }
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }
            const data = await response.json();
            this.cache[path] = data;
            return data;
        } catch (error) {
            console.error(`Error loading ${path}:`, error);
            throw error;
        }
    }

    async getCategories() {
        if (localStorage.getItem('debug') === '1') {
            console.log('getCategories');
        }
        const startTime = performance.now();
        const data = await this.loadJSON('quiz/index.json');
        const loadTime = performance.now() - startTime;
        return [...data.categories, loadTime];
    }

    async getThemes(categoryId) {
        if (localStorage.getItem('debug') === '1') {
            console.log('getThemes');
        }
        const startTime = performance.now();
        
        // First get the category to find the folder
        const categoriesData = await this.loadJSON('quiz/index.json');
        const category = categoriesData.categories.find(cat => cat.ID == categoryId);
        
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }
        
        // Load the themes from the category's main.json
        const themesData = await this.loadJSON(`quiz/${category.folder}/main.json`);
        const themes = themesData.themes.filter(theme => theme.categoryID == categoryId);
        
        const loadTime = performance.now() - startTime;
        return [...themes, loadTime];
    }

    async getQuestions(themeId) {
        if (localStorage.getItem('debug') === '1') {
            console.log('getQuestions');
        }
        const startTime = performance.now();
        
        try {
            // Find the theme to get the file path
            const categoriesData = await this.loadJSON('quiz/index.json');
            let themeFile = null;
            let categoryFolder = null;
            let foundTheme = null;
            
            for (const category of categoriesData.categories) {
                const themesData = await this.loadJSON(`quiz/${category.folder}/main.json`);
                const theme = themesData.themes.find(t => t.ID == themeId);
                if (theme) {
                    themeFile = theme.file;
                    categoryFolder = category.folder;
                    foundTheme = theme;
                    break;
                }
            }
            
            if (!themeFile) {
                throw new Error(`Theme ${themeId} not found`);
            }
            
            // Load questions from the specific file
            const questionsData = await this.loadJSON(`quiz/${categoryFolder}/${themeFile}`);
            // Don't filter by themeID - just return all questions from the file
            let questions = questionsData.questions;
            
            // Ensure questions have the expected format (options, answer, explanation)
            questions = questions.map(q => {
                // If old format, convert to new format
                if (!q.options && (q.trufal !== undefined)) {
                    return {
                        ...q,
                        options: ["Sant", "Usant"],
                        answer: q.trufal === "1" ? 1 : 2,
                        explanation: q.fact || "No explanation provided"
                    };
                }
                return q;
            });
            
            // Shuffle questions for randomness
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
            
            const loadTime = performance.now() - startTime;
            return [...questions, loadTime];
        } catch (error) {
            console.error("Error in getQuestions:", error);
            return [[], performance.now() - startTime];
        }
    }

    async getQuestionsWithAnswers(themeId) {
        if (localStorage.getItem('debug') === '1') {
            console.log('getQuestionsWithAnswers');
        }
        return this.getQuestions(themeId);
    }

    async getQuestionSummary(questionId) {
        if (localStorage.getItem('debug') === '1') {
            console.log('getQuestionSummary');
        }
        const startTime = performance.now();
        
        // Search through all categories and themes to find the question
        const categoriesData = await this.loadJSON('quiz/index.json');
        
        for (const category of categoriesData.categories) {
            const themesData = await this.loadJSON(`quiz/${category.folder}/main.json`);
            
            for (const theme of themesData.themes) {
                const questionsData = await this.loadJSON(`quiz/${category.folder}/${theme.file}`);
                const question = questionsData.questions.find(q => q.qnID == questionId);
                
                if (question) {
                    const loadTime = performance.now() - startTime;
                    return [question, loadTime];
                }
            }
        }
        
        throw new Error(`Question ${questionId} not found`);
    }
}

// Create global instance
window.dataService = new DataService();