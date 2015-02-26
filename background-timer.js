
var timer = setInterval(function(){
    var date = new Date();
    postMessage(date.getTime());
},1);