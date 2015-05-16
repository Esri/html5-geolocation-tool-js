var INTERVAL = 1000; //ms
setInterval(function(){
    var date = new Date();
    postMessage(date.getTime());
},INTERVAL);