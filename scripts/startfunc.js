function start()
{
    if (localStorage.getItem('debug') === '1') {
        console.log('start');
    }
    //starts preformanse timer
var t0 = performance.now();
document.getElementById("main").innerHTML = "<p>Laster inn kategorier...</p>";

//fetches the categories from the data service
dataService.getCategories()
    .then(data => {
        //extracts the response time from the array
        let loadTime = data.pop();
        console.log('loaded categories in ' + loadTime + ' ms');
        if (data.length > 0) {
            //makes the top of the website
            var Temp = '<div class="title">Naturfag greier</div><div class="top1">';
            //repeats this until all of the data is in boxes
            data.forEach((itemData) => {
                Temp += '<div class="box">';
                Temp += '<div class="box-1n3">' + itemData.Name + '</div>';
                Temp += '<div class="box-info">' + itemData.about + '</div>';
                Temp += '<div class="box-1n3"><button class="btn" id="' + itemData.ID + '" onClick="themeGet(this.id)">velg</button> </div>';
                Temp += '</div>'
            });
            //stops preformanse timer
            var t1 = performance.now();
            //makes the bottom bar with performance
            Temp += '</div><!-- 1/2 1 = hovedside, katgori velging, spillsiden 2 = spørsmålet, sanheten --> <div class="bottom"> data load: ' + (~~loadTime) + ' ms page build: ' + (~~(t1 - t0)) + ' ms</div>';
            //inserts the html into the document
            document.getElementById("main").innerHTML = Temp;
        }
    })
    .catch(error => {
        console.error('Error loading categories:', error);
        document.getElementById("main").innerHTML = "<p>Feil ved lasting av kategorier: " + error.message + "</p>";
    });
}