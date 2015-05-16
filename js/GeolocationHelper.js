/**
 * A library for normalizing HTML Geolocation API raw data
 * @author @agup
 * @param filters Required. Either set properties to a value or null. If a filter is set to null it will be ignored.
 * @constructor
 */
var GeolocationHelper = function(/* Object */ filters) {

    // AVAILABLE FILTERS
    this.UNITS;
    this.MAX_ACCURACY;
    this.MAX_MEDIAN_ACCURACY;
    this.MAX_STDDEVIATION_ACCURACY;
    this.MAX_STDDEVIATION_LAT;
    this.MAX_STDDEVIATION_LON;
    this.MAX_ARRAY_SIZE;

    // APPLY FILTERS IF NECESSARY. Otherwise use default values.

    "UNITS" in filters ? this.UNITS = filters.UNITS : this.UNITS = "M"; // M = miles, K = km, N = nautical miles
    "MAX_ACCURACY" in filters ? this.MAX_ACCURACY = filters.MAX_ACCURACY : this.MAX_ACCURACY = 100 ;
    "MAX_MEDIAN_ACCURACY" in filters ? this.MAX_MEDIAN_ACCURACY = filters.MAX_MEDIAN_ACCURACY : this.MAX_MEDIAN_ACCURACY = 20;
    "MAX_STDDEVIATION_ACCURACY" in filters ? this.MAX_STDDEVIATION_ACCURACY = filters.MAX_STDDEVIATION_ACCURACY : this.MAX_STDDEVIATION_ACCURACY = 2.5;
    "MAX_STDDEVIATION_LAT" in filters ? this.MAX_STDDEVIATION_LAT = filters.MAX_STDDEVIATION_LAT : this.MAX_STDDEVIATION_LAT = 0.0001;
    "MAX_STDDEVIATION_LON" in filters ? this.MAX_STDDEVIATION_LON = filters.MAX_STDDEVIATION_LON : this.MAX_STDDEVIATION_LON = 0.0001;
    "MAX_ARRAY_SIZE" in filters ? this.MAX_ARRAY_SIZE = filters.MAX_ARRAY_SIZE : this.MAX_ARRAY_SIZE = 25;

    // SET ALL THE VARIABLES

    var stddev_accuracy = 0, stddev_lat = 0, stddev_lon = 0, stddev_distance = 0;
    var med_accuracy = 0, med_lat = 0, med_lon = 0;
    var med_distance = 0, med_speed = 0, med_timediff = 0;

    var accuracyArray = [];
    var timeStampArray = [];
    var speedArray = [];
    var latArray = [];
    var lonArray = [];
    var latLonArray = [];
    var distanceArray = []; // an array of distances between each successive lat and lon

    /**
     * Reset all internal arrays to empty.
     */
    this.reset = function(){
        timeStampArray = [];
        speedArray = [];
        accuracyArray = [];
        distanceArray = [];
        latArray = [];
        lonArray = [];
        latLonArray = [];
    };

    /**
     * All values are required!
     * @param accuracy
     * @param lat
     * @param lon
     * @param timestamp
     * @param callback
     */
    this.process = function(accuracy, lat, lon, timestamp, callback) {

        this.manageArraySize();

        // REJECT any lat lon values if accuracy is greater than our maximum acceptable
        if(accuracy < this.MAX_ACCURACY){

            accuracyArray.push(accuracy);

            med_accuracy = this.median(accuracyArray);
            stddev_accuracy = this.standardDeviation(accuracyArray);
        }

        latArray.push(lat);
        lonArray.push(lon);
        latLonArray.push({
            latitude: lat,
            longitude: lon
        });

        timeStampArray.push(timestamp);

        if(latArray.length > 1){
            var previous_lat = latArray[latArray.length - 1];
            var previous_lon = lonArray[lonArray.length - 1];

            var units = this.UNITS;
            var distance = this.distance(previous_lat, previous_lon, lat, lon, units);
            distanceArray.push(distance);
            var timeDiff = timestamp - timeStampArray[timeStampArray.length - 1] / 1000;
            var timeDiffInHours = Math.floor(( timeDiff  %= 86400) / 3600);
            var speed = distance / timeDiffInHours;
            speedArray.push(speed);
        }

        med_lat = this.median(latArray);
        med_lon = this.median(lonArray);
        med_speed = this.median(speedArray);
        med_distance = this.median(distanceArray);
        med_timediff = this.medianTime(timeStampArray);
        stddev_lat = this.standardDeviation(latArray);
        stddev_lon = this.standardDeviation(lonArray);
        stddev_distance = this.standardDeviation(distanceArray);

        this.filter(accuracy, callback);
    };

    this.filter = function(accuracy, callback) {

        var reject = false;
        var payload = {};

        if (accuracy > this.MAX_ACCURACY) {
            reject = true;
        }
        if (med_accuracy > this.MAX_MEDIAN_ACCURACY) {
            reject = true;
        }
        if (stddev_accuracy > this.MAX_STDDEVIATION_ACCURACY) {
            reject = true;
        }
        if (stddev_lat > this.MAX_STDDEVIATION_LAT) {
            reject = true;
        }
        if (stddev_lon > this.MAX_STDDEVIATION_LON) {
            reject = true;
        }

        payload.reject  = reject;
        payload.count = latArray.length;
        payload.med_lat = med_lat;
        payload.med_lon = med_lon;
        payload.med_accuracy = med_accuracy;
        payload.med_speed = med_speed;
        payload.med_distance = med_distance;
        payload.med_time_diff = med_timediff;
        payload.stddev_lat = stddev_lat;
        payload.stddev_lon = stddev_lon;
        payload.stddev_accuracy = stddev_accuracy;
        payload.stddev_distance = stddev_distance;
        payload.center_point = this.getCenter(latLonArray);

        callback(payload);
    };

    this.manageArraySize = function(){
        // Manage our array size to keep from blowing up memory
        if(accuracyArray.length > this.MAX_ARRAY_SIZE){
            accuracyArray.shift();
        }

        if(distanceArray.length > this.MAX_ARRAY_SIZE) {
            distanceArray.shift();
        }

        if(latLonArray.length > this.MAX_ARRAY_SIZE) {
            latLonArray.shift();
        }

        if(latArray.length > this.MAX_ARRAY_SIZE){
            latArray.shift();
        }

        if(lonArray.length > this.MAX_ARRAY_SIZE){
            lonArray.shift();
        }
    };

    this.distance = function(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344 };
        if (unit=="N") { dist = dist * 0.8684 };
        return dist;
    };


    /**
     * standardDeviation() and average() functions courtesy of:
     * http://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
     * @param values Array
     * @returns {number}
     */
    this.standardDeviation = function(values) {
        var avg = this.average(values);

        var squareDiffs = values.map(function(value){
            var diff = value - avg;
            var sqrDiff = diff * diff;
            return sqrDiff;
        });

        var avgSquareDiff = this.average(squareDiffs);

        var stdDev = Math.sqrt(avgSquareDiff);
        return stdDev;
    };

    this.average = function(data) {
        var sum = data.reduce(function(sum, value){
            return sum + value;
        }, 0);

        var avg = sum / data.length;
        return avg;
    };

    /**
     * All credits to: https://gist.github.com/caseyjustus/1166258
     * @param array
     * @returns {*}
     */
    this.median = function(array) {

        if(array.length == 1) return array[0];

        array.sort( function(a,b) {return a - b;} );

        var half = Math.floor(array.length/2);

        if(array.length % 2) {
            return array[half];
        }
        else {
            return (array[half-1] + array[half]) / 2.0;
        }
    };

    this.medianTime = function(array) {

        if(array.length == 1) return 0;

        var diff = array.map(function(currentVal,index){
            if(index > 0) {
                return currentVal - array[index - 1];
            }
        });

        return this. median(diff);

    };

    /**
     * Returns an array of Object {latitude: y, longitude: x}
     * @returns {Array}
     */
    this.getLatLonArray = function(){
        return latLonArray;
    };

    /**
     * All credits: https://github.com/manuelbieh/Geolib/blob/master/src/geolib.js
     * @param coords
     * @returns {*}
     */
    this.getCenter = function(coords) {

        if (!coords.length) {
            return false;
        }

        var X = 0.0;
        var Y = 0.0;
        var Z = 0.0;
        var lat, lon, hyp;

        coords.forEach(function(coord) {
            lat = coord.latitude * Math.PI / 180;
            lon = coord.longitude * Math.PI / 180;

            X += Math.cos(lat) * Math.cos(lon);
            Y += Math.cos(lat) * Math.sin(lon);
            Z += Math.sin(lat);
        });

        var nb_coords = coords.length;
        X = X / nb_coords;
        Y = Y / nb_coords;
        Z = Z / nb_coords;

        lon = Math.atan2(Y, X);
        hyp = Math.sqrt(X * X + Y * Y);
        lat = Math.atan2(Z, hyp);

        return {
            latitude: (lat * 180 / Math.PI).toFixed(6),
            longitude: (lon * 180 / Math.PI).toFixed(6)
        };
    }

};
