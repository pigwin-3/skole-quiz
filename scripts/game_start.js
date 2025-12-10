function game(game_id)
{
    if (localStorage.getItem('debug') === '1') {
        console.log('game');
    }
    console.log('game id = ' + game_id);
    // Store the game_id globally so other functions can access it
    window.currentGameId = game_id;
    
    //starts preformanse monitor
    var t0 = performance.now();

    var Temp = '<div class="title">Spill</div>';
    Temp += '<div class="top1">'
  
    Temp += '<button class="btn2" onClick="startGame(\'' + game_id + '\')">Start spill</button>'
    //stops preformanse timer
    var t1 = performance.now();
    //makes the bottem bar with preformanse
    Temp += '</div> <div class="bottom"> page build: ' + (~~(t1 - t0)) + ' ms</div>';
    //inserts the html into the document
    document.getElementById("main").innerHTML = Temp;
}