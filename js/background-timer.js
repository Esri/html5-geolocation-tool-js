var INTERVAL = 1000; //ms
var timer = setInterval(function(){
    var date = new Date();
    postMessage(date.getTime());
},INTERVAL);

onmessage = function(e) {
    if(e.data === "stop"){
        clearInterval(timer);
        close();
    }
};
