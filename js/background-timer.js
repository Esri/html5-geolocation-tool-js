var INTERVAL = 1; //seconds
setInterval(function(){
    var date = new Date();
    postMessage(date.getTime());
},INTERVAL);