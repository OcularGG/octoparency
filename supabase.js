// Mock implementation that uses localStorage
export async function saveSearchTerm(searchTerm) {
    console.log('Saving search term to localStorage:', searchTerm);
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history.unshift({
        search_term: searchTerm,
        timestamp: new Date().toISOString()
    });
    // Keep only the last 10 searches
    if (history.length > 10) {
        history.pop();
    }
    localStorage.setItem('searchHistory', JSON.stringify(history));
    return { data: { search_term: searchTerm } };
}

export async function getSearchHistory() {
    console.log('Getting search history from localStorage');
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
}
