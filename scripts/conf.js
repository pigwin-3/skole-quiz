function conf(temp) {
    if (temp == 'api') {
        return null; // No API needed anymore
    }
}

if (!window.dataService) {
    window.dataService = new DataService();
}