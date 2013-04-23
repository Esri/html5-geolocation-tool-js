/**
 * Basic Geolocation API demonstration app.
 *
 * Version: 0.4 (Apr 2013)
 * Creation Date: Feb. 2012
 * Author: @agup (Twitter)
 */

dojo.require("esri.map");

var map;
var _helper;

function init() {

    map = new esri.Map("map",{
        basemap:"topo",
        slider: false
    });

    dojo.connect(map, "onLoad", function () {

        //Some browsers don't show full height after onLoad
        setTimeout(function(){
            map.reposition();
            map.resize();
        },500);

        _helper = new LocationHelper(map);
        _helper.startHTML5Location();
    });
}


var LocationHelper = function(/* esri.Map */ map){
    this._watchID = null;
    this.map = map;
    this._setHighAccuracy = true;
    this._webMercatorMapPoint = null;
    this._accuracyDataCSV = "date,lat,lon,accuracy,high_accuracy_boolean,altitude,heading,speed,altitude_accuracy,\r\n";
    this._locationDiv = document.getElementById("location");
    this._altitudeDiv = document.getElementById("altitude");
    this._speedDiv = document.getElementById("speed");
    this._headingDiv = document.getElementById("heading");
    this._timeStampDiv = document.getElementById("timestamp");
    this._accuracyDiv = document.getElementById("accuracy");

    var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

    window.addEventListener(orientationEvent, function () {
        var time = setTimeout(function(){
            if(this.map != null && this._webMercatorMapPoint != null){
                this.map.reposition();
                this.map.resize();
                //map.width = screen.width;
                this.map.centerAndZoom(this._webMercatorMapPoint, 14);
            }
        },750);
    }, false);
}

LocationHelper.prototype.startHTML5Location = function(){

    var locationDiv = this._locationDiv;
    var altitudeDiv = this._altitudeDiv;
    var speedDiv = this._speedDiv;
    var headingDiv = this._headingDiv;
    var timeStampDiv = this._timeStampDiv;
    var accuracyDiv = this._accuracyDiv;
    var accuracyDataCSV = this._accuracyDataCSV;

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            _processGeolocationResult.bind(this)/* use bind() to maintain context */,
            _html5Error
        );

        this._watchID = navigator.geolocation.watchPosition(
            _processGeolocationResult.bind(this),
            _html5Error,
            {
                timeout:36000,
                enableHighAccuracy: this._setHighAccuracy,
                maximumAge: 5000
            }
        );

        //For more info on maximumAge (milliseconds): http://dev.w3.org/geo/api/spec-source.html#max-age
        //For more info on timeout (milliseconds): http://dev.w3.org/geo/api/spec-source.html#timeout
        //For more info on enableHighAccuracy: http://dev.w3.org/geo/api/spec-source.html#high-accuracy
    }
    else {
        alert("Sorry, your browser does not support geolocation");
    }

    function _processGeolocationResult(position) {
        var html5Lat = position.coords.latitude; //Get latitude
        var html5Lon = position.coords.longitude; //Get longitude
        var html5TimeStamp = position.timestamp; //Get timestamp
        var html5Accuracy = position.coords.accuracy; 	//Get accuracy in meters
        var html5Heading = position.coords.heading;
        var html5Speed = position.coords.speed;
        var html5Altitude = position.coords.altitude;

        console.log("success " + html5Lat + ", " + html5Lon);
        _displayGeocodedLocation(html5Lat, html5Lon, html5TimeStamp, html5Accuracy,html5Heading,html5Speed,html5Altitude);

        if (html5Lat != null && html5Lon != null) {
            //zoomToLocation(html5Lat, html5Lon);

            //Don't allow string to get beyond certain length.
            //Otherwise you'll create a huge memory leak. :-)
            if(this._accuracyDataCSV.length < 50000){

                this._accuracyDataCSV = this._accuracyDataCSV + Date(html5TimeStamp).toLocaleString() +
                    "," + html5Lat +
                    "," + html5Lon +
                    "," + html5Accuracy +
                    "," + this._setHighAccuracy +
                    "," + html5Altitude +
                    "," + html5Heading +
                    "," + html5Speed +
                    "," + position.coords.altitudeAccuracy +
                    ",\r\n";
            }
            else{
                console.log("Truncating CSV string. It is too long");
            }

            if(html5Lat != 0){
                var wgsPt = new esri.geometry.Point(html5Lon,html5Lat, new esri.SpatialReference({ wkid: 4326 }))
                this._webMercatorMapPoint = esri.geometry.geographicToWebMercator(wgsPt);
                this.map.centerAndZoom(this._webMercatorMapPoint, 14);
                _showLocation(html5Lat,html5Lon,this._webMercatorMapPoint);
            }
        }


    }


    function _showLocation(myLat,myLong,/* Web Mercator */mapPoint) {

        var HomeSymbol = null;

        if(window.devicePixelRatio >= 2){
            HomeSymbol = new esri.symbol.PictureMarkerSymbol("images/pushpin104x108.png", 104, 108).setColor(new dojo.Color([0, 0, 255]));
        }
        else{
            HomeSymbol = new esri.symbol.PictureMarkerSymbol("images/pushpin2.png", 48, 48).setColor(new dojo.Color([0, 0, 255]));
        }
        var pictureGraphic = new esri.Graphic(mapPoint, HomeSymbol)

        //    map.infoWindow.setTitle("HTML5 Location");
        //    map.infoWindow.setContent('Lat : ' + myLat.toFixed(4) + ", " + ' Long: ' + myLong.toFixed(4));
        //    map.infoWindow.resize(200,65);
        //    map.infoWindow.show(mapPoint, esri.dijit.InfoWindow.ANCHOR_LOWERLEFT);

        this.map.graphics.clear();
        this.map.graphics.add(pictureGraphic);

    }

    function _displayGeocodedLocation(html5Lat, html5Lon, html5TimeStamp, html5Accuracy, html5Heading, html5Speed, html5Altitude) {
        var altitude = "N/A";
        if(html5Altitude != null) altitude = html5Altitude.toFixed(2) + "m";
        var speed = "N/A";
        if (html5Speed != null) (html5Speed * 3600 / 1000).toFixed(2) + "km/hr";
        var heading = "N/A";
        if (html5Heading != null) html5Heading.toFixed(2) + "deg";

        locationDiv.innerHTML = html5Lat.toFixed(4) + ", " + html5Lon.toFixed(4);
        altitudeDiv.innerHTML = "Altitude: " + altitude;
        speedDiv.innerHTML = "Speed: " + speed;
        headingDiv.innerHTML = "Heading: " + heading;

        //Tested on desktop IE9, Chrome 17, Firefox 10, Safari ?
        //Mobile browser: Android 2.3.6
        //There is a bug in Safari browsers on Mac that shows the year as 1981
        //To get around the bug you could manually parse and then format the date. I chose not to for this demo.
        var date = new Date(html5TimeStamp)
        timeStampDiv.innerHTML = date;
        accuracyDiv.innerHTML =
            "Accuracy: " + html5Accuracy.toFixed(2) + "m";

    }


    function _html5Error(error) {
        var error_value = "null";

        switch(error.code){
            case 1:
                error_value = "PERMISSION_DENIED";
                break;
            case 2:
                error_value = "POSITION_UNAVAILABLE";
                break;
            case 3:
                //Read more at http://dev.w3.org/geo/api/spec-source.html#timeout
                error_value = "TIMEOUT";
                break;
        }
        alert('There was a problem retrieving your location: ' + error_value);
    }

}

LocationHelper.prototype.setHighAccuracy = function(/* boolean */ value){
    this._setHighAccuracy = value;

    if(this._watchID != null)navigator.geolocation.clearWatch(this._watchID);
    this.startHTML5Location();
}

LocationHelper.prototype.getHighAccuracy = function(){
    return this._setHighAccuracy;
}

LocationHelper.prototype.getAccuracyCSV = function(){
    return this._accuracyDataCSV;
}

LocationHelper.prototype.getWatchId = function(){
    return this._watchID;
}

LocationHelper.prototype.shutOffGeolocation = function(){
    try{
        navigator.geolocation.clearWatch(this._watchID);
        this._watchID = null;
    }
    catch(err){
        console.log("shutOffGeolocation error: " + err);
    }
}


function shutOffGeolocation(){
    var button = dojo.byId("shutOffGeo");

    if(_helper.getWatchId() != null){
        _helper.shutOffGeolocation();
        button.innerHTML = "Start Geolocation";
        alert("Geolocation has been shutoff");
    }
    else{
        _helper.startHTML5Location();
        button.innerHTML = "Stop Geolocation";
    }
}

function toggleHighAccuracy(){
    var button = dojo.byId("toggleHighAccuracy");

    if(_helper.getHighAccuracy() == true){
        button.innerHTML = "High Accuracy Off";
        _helper.setHighAccuracy(false);
    }
    else{
        button.innerHTML = "High Accuracy On";
        _helper.setHighAccuracy(true);
    }
}

function sendEmail(){
    window.open('mailto:myself@example.com?subject=HTML5 Accuracy Data&body=' + encodeURIComponent(_accuracyDataCSV));
}

dojo.ready(init);