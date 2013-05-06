/**
 * Geolocation API demonstration library.
 *
 * Version: 0.4 (Apr 2013)
 * Creation Date: Feb. 2012
 * Author: @agup (Twitter)
 */
var LocationHelper = function(/* esri.Map */ map){

    this._map = map;
    this._watchID = null;
    this._setHighAccuracy = true;
    this._webMercatorMapPoint = null;
    this._accuracyDataCSV = "date,lat,lon,accuracy,high_accuracy_boolean,altitude,heading,speed,altitude_accuracy,interval_time,total_elapsed_time,\r\n";
    this._pushPinLarge = new esri.symbol.PictureMarkerSymbol("images/pushpin104x108.png", 104, 108).setColor(new dojo.Color([0, 0, 255]));
    this._pushPinSmall = new esri.symbol.PictureMarkerSymbol("images/pushpin2.png", 48, 48).setColor(new dojo.Color([0, 0, 255]));
    this._locatorMarkerLarge = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND,
        10,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1),
        new dojo.Color([255,255,0,0.5]));

    this._locatorMarkerSmall = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND,
        5,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1),
        new dojo.Color([255,255,0,0.5]));
    this._locatorMarkerGraphicsLayer = new esri.layers.GraphicsLayer();
    this._map.addLayer(this._locatorMarkerGraphicsLayer);

    /**
     * Allows points to accumulate on map. Default is true.
     * @type {boolean}
     */
    this.accumulate = true;
    /**
     * Geolocation timeout property
     * @type {number}
     */
    this.timeout = 15000;
    /**
     * Geolocation maximumAge property
     * @type {number}
     */
    this.maximumAge = 60000;
    /**
     * Required
     * @type {<div>}
     */
    this.geoIndicatorDiv = null;
    /**
     * Required
     * @type {<div>}
     */
    this.locationDiv = null;
    /**
     * Required
     * @type {<div>}
     */
    this.altitudeDiv = null;
    /**
     * Required
     * @type {<div>}
     */
    this.headingDiv = null;
    /**
     * Required
     * @type {<div>}
     */
    this.speedDiv = null;
    /**
     * Required
     * @type {<div>}
     */
    this.timeStampDiv = null;
    /**
     * Required
     * @type {<div>}
     */
    this.accuracyDiv = null;

    var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

    window.addEventListener(orientationEvent, function () {
        var time = setTimeout(function(){
            if(this._map != null && this._webMercatorMapPoint != null){
                this._map.reposition();
                this._map.resize();
                //map.width = screen.width;
                this._map.centerAndZoom(this._webMercatorMapPoint, 14);
            }
        },500);
    }, false);
}

/**
 * Turns on the geolocation capabilities.
 */
LocationHelper.prototype.startGeolocation = function(){

    var _dateStart = new Date();
    var _previousDate = null;

    try{
        if(this.locationDiv == null || this.altitudeDiv == null || this.headingDiv == null || this.speedDiv == null || this.timeStampDiv == null || this.accuracyDiv == null ){
            throw new Error("LocationHelper: you must add all required DIVS");
        }

        else if (navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(
                _processGeolocationResult.bind(this)/* use bind() to maintain scope */,
                _html5Error
            );

            this._watchID = navigator.geolocation.watchPosition(
                _processGeolocationResult.bind(this),
                _html5Error,
                {
                    timeout:this.timeout,
                    enableHighAccuracy: this._setHighAccuracy,
                    maximumAge: this.maximumAge
                }
            );

            //For more info on maximumAge (milliseconds): http://dev.w3.org/geo/api/spec-source.html#max-age
            //For more info on timeout (milliseconds): http://dev.w3.org/geo/api/spec-source.html#timeout
            //For more info on enableHighAccuracy: http://dev.w3.org/geo/api/spec-source.html#high-accuracy
        }
        else {
            alert("Sorry, your browser does not support geolocation");
        }
    }
    catch(err){
        alert("Unable to start geolocation. See console.log for message.")
        console.log(err.toString());
    }

    /**
     * Post-process the results from a geolocation position object.
     * @param position
     * @private
     */
    function _processGeolocationResult(position) {
        var html5Lat = position.coords.latitude; //Get latitude
        var html5Lon = position.coords.longitude; //Get longitude
        var html5TimeStamp = position.timestamp; //Get timestamp
        var html5Accuracy = position.coords.accuracy; 	//Get accuracy in meters
        var html5Heading = position.coords.heading;
        var html5Speed = position.coords.speed;
        var html5Altitude = position.coords.altitude;

        console.log("success " + html5Lat + ", " + html5Lon);
        try{
            this._displayGeocodedLocation(html5Lat, html5Lon, html5TimeStamp, html5Accuracy,html5Heading,html5Speed,html5Altitude);
        }
        catch(error)
        {
            console.log("Error " + error.toString());
        }

        if (html5Lat != null && html5Lon != null) {
            //zoomToLocation(html5Lat, html5Lon);

            //Don't allow string to get beyond certain length.
            //Otherwise you'll create a huge memory leak. :-)
            if(this._accuracyDataCSV.length < 50000){

                var newDateDiff = null;
                var ms = null;
                var dateNow = new Date();
                var totalElapsedTime =  _getTimeDifference(new Date(Math.abs(dateNow.getTime() - _dateStart.getTime())));

                if(_previousDate == null){
                    newDateDiff = new Date(Math.abs(dateNow.getTime() - _dateStart.getTime()));
                }
                else{
                    newDateDiff = new Date(Math.abs(dateNow.getTime() - _previousDate.getTime()));
                }

                _previousDate = new Date();

                var dateResultString = _getTimeDifference(newDateDiff);

                this._accuracyDataCSV = this._accuracyDataCSV + Date(html5TimeStamp).toLocaleString() +
                    "," + html5Lat +
                    "," + html5Lon +
                    "," + html5Accuracy +
                    "," + this._setHighAccuracy +
                    "," + html5Altitude +
                    "," + html5Heading +
                    "," + html5Speed +
                    "," + position.coords.altitudeAccuracy +
                    "," + dateResultString +
                    "," + totalElapsedTime +
                    ",\r\n";
            }
            else{
                console.log("Truncating CSV string. It is too long");
            }

            if(html5Lat != 0){
                var wgsPt = new esri.geometry.Point(html5Lon,html5Lat, new esri.SpatialReference({ wkid: 4326 }))
                this._webMercatorMapPoint = esri.geometry.geographicToWebMercator(wgsPt);
                //this._map.centerAndZoom(this._webMercatorMapPoint, 14);
                this._showLocation(html5Lat,html5Lon,this._webMercatorMapPoint);
            }
        }
    }

    /**
     * Calculate HH:MM:SS:MS from a given Date in millis
     * @param date
     * @returns {string}
     * @private
     */
    function _getTimeDifference(/* Date */ date){;
        var msec = date;
        var hh = Math.floor(msec / 1000 / 60 / 60);
        msec -= hh * 1000 * 60 * 60;
        var mm = Math.floor(msec / 1000 / 60);
        msec -= mm * 1000 * 60;
        var ss = Math.floor(msec / 1000);
        msec -= ss * 1000;

        hh = hh < 10 ? "0" + hh : hh;
        mm = mm < 10 ? "0" + mm : mm;
        ss = ss < 10 ? "0" + ss : ss;

        console.log("time: " + hh + ":" + mm + ":" + ss + ":" + msec);

        return hh + ":" + mm + ":" + ss + ":" + msec;
    }

    /**
     * Handle geolocation service errors
     * @param error
     * @private
     */
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

/**
 * Write out the geolocation results to the display
 * @param html5Lat
 * @param html5Lon
 * @param html5TimeStamp
 * @param html5Accuracy
 * @param html5Heading
 * @param html5Speed
 * @param html5Altitude
 * @private
 */
LocationHelper.prototype._displayGeocodedLocation = function(html5Lat, html5Lon, html5TimeStamp, html5Accuracy, html5Heading, html5Speed, html5Altitude) {
    var altitude = "N/A";
    if(html5Altitude != null) altitude = html5Altitude.toFixed(2) + "m";
    var speed = "N/A";
    if (html5Speed != null) (html5Speed * 3600 / 1000).toFixed(2) + "km/hr";
    var heading = "N/A";
    if (html5Heading != null) html5Heading.toFixed(2) + "deg";

    this.locationDiv.innerHTML = html5Lat.toFixed(4) + ", " + html5Lon.toFixed(4);
    this.altitudeDiv.innerHTML = "Altitude: " + altitude;
    this.speedDiv.innerHTML = "Speed: " + speed;
    this.headingDiv.innerHTML = "Heading: " + heading;
    this.geoIndicatorDiv.text("Geo: ON");
    this.geoIndicatorDiv.css('color','green');

    //Tested on desktop IE9, Chrome 17, Firefox 10, Safari ?
    //Mobile browser: Android 2.3.6
    //There is a bug in Safari browsers on Mac that shows the year as 1981
    //To get around the bug you could manually parse and then format the date. I chose not to for this demo.
    var date = new Date(html5TimeStamp)
    this.timeStampDiv.innerHTML = date;
    this.accuracyDiv.innerHTML =
        "Accuracy: " + html5Accuracy.toFixed(2) + "m";

}

/**
 * Draw the pushpin graphic on the map
 * @param myLat
 * @param myLong
 * @param geometry
 * @private
 */
LocationHelper.prototype._showLocation = function(/* number */myLat,/* number */myLong,/* esri.geometry.Geometry */geometry) {

    var HomeSymbol = null;
    var locatorSymbol = null;

    if(window.devicePixelRatio >= 2){
        HomeSymbol = this._pushPinLarge;
        locatorSymbol = this._locatorMarkerLarge;
    }
    else{
        HomeSymbol = this._pushPinSmall;
        locatorSymbol = this._locatorMarkerSmall;
    }

    //    map.infoWindow.setTitle("HTML5 Location");
    //    map.infoWindow.setContent('Lat : ' + myLat.toFixed(4) + ", " + ' Long: ' + myLong.toFixed(4));
    //    map.infoWindow.resize(200,65);
    //    map.infoWindow.show(mapPoint, esri.dijit.InfoWindow.ANCHOR_LOWERLEFT);

    this._map.graphics.clear();
    this._map.graphics.add(new esri.Graphic(geometry, HomeSymbol));
    this._map.centerAndZoom(geometry, 14);

    if(this.accumulate == true)this._locatorMarkerGraphicsLayer.add(new esri.Graphic(geometry, locatorSymbol));

}

/**
 * Sets the high accuracy property. Setting this property will force
 * the geolocation service to restart with the new property.
 * @param value boolean
 */
LocationHelper.prototype.setHighAccuracy = function(/* boolean */ value){
    this._setHighAccuracy = value;

    if(this._watchID != null)navigator.geolocation.clearWatch(this._watchID);
    this.startGeolocation();
}

/**
 * Returns whether or not high-accuracy property has been set.
 * @returns {boolean}
 */
LocationHelper.prototype.getHighAccuracy = function(){
    return this._setHighAccuracy;
}

/**
 * Gets a CSV file compiled from the geolocation service including
 * date,lat,lon,accuracy,high_accuracy_boolean,altitude,heading,speed,
 * altitude_accuracy,interval_time,total_elapsed_time
 * @returns {string}
 */
LocationHelper.prototype.getAccuracyCSV = function(){
    return this._accuracyDataCSV;
}

/**
 * Returns a reference to the geolocation watchPosition() method.
 * @returns {number}
 */
LocationHelper.prototype.getWatchId = function(){
    return this._watchID;
}

/**
 * Executes a clearWatch() to cease all watchPosition() activity.
 */
LocationHelper.prototype.stopGeolocation = function(){
    try{
        navigator.geolocation.clearWatch(this._watchID);
        this._watchID = null;
        this.geoIndicatorDiv.text("Geo: OFF");
        this.geoIndicatorDiv.css('color','red');
    }
    catch(err){
        console.log("stopGeolocation error: " + err.toString());
    }
}