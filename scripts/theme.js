async function themeGet(category_id) {
    if (localStorage.getItem('debug') === '1') {
        console.log('themeGet');
    }
    console.log('category id = ' + category_id);
    
    // Start performance monitor
    var t0 = performance.now();
    
    try {
        // Use dataService to get themes for this category
        const themesData = await window.dataService.getThemes(category_id);
        const themes = themesData.slice(0, -1); // Remove timing data
        const loadTime = themesData[themesData.length - 1]; // Get timing data
        
        console.log('fetched from dataService ' + loadTime + ' ms');
        
        if (themes && themes.length > 0) {
            // Make the top of the website
            var Temp = '<div class="title">Velg tema</div><div class="top1">';
            
            // Repeat this until all of the data is in boxes
            themes.forEach((itemData) => {
                Temp += '<div class="box">';
                Temp += '<div class="box-1n3">' + itemData.Name + '</div>';
                Temp += '<div class="box-info">' + itemData.about + '</div>';
                Temp += '<div class="box-1n3"><button class="btn" id="' + itemData.ID + '" onClick="game(this.id)">velg</button></div>';
                Temp += '</div>';
            });
            
            // Stop performance timer
            var t1 = performance.now();
            
            // Make the bottom bar with performance
            Temp += '</div><!-- 1/2 1 = hovedside, kategori velging, spillsiden 2 = spørsmålet, sannheten --> <div class="bottom"> data load: ' + (~~loadTime) + ' ms page build: ' + (~~(t1 - t0)) + ' ms</div>';
            
            // Insert the html into the document
            document.getElementById("main").innerHTML = Temp;
        } else {
            document.getElementById("main").innerHTML = '<div class="title">Ingen temaer funnet</div>';
        }
    } catch (error) {
        console.error('Error fetching theme data:', error);
        document.getElementById("main").innerHTML = '<div class="title">Feil ved lasting av temaer: ' + error.message + '</div>';
    }
}