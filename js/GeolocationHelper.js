/**
 * A library for normalizing HTML Geolocation API raw data
 * @author @agup
 * @param filters Required. Either set properties to a value or null. If a filter is set to null it will be ignored.
 * @constructor
 */
var GeolocationHelper = function(/* Object */ filters) {

    "UNITS" in filters ? this.UNITS = filters.UNITS : this.UNITS = "M"; // M = miles, K = km, N = nautical miles
    "MAX_ACCURACY" in filters ? this.MAX_ACCURACY = filters.MAX_ACCURACY : this.MAX_ACCURACY = 100 ;
    "MAX_AVERAGE_ACCURACY" in filters ? this.MAX_AVERAGE_ACCURACY = filters.MAX_AVERAGE_ACCURACY : this.MAX_AVERAGE_ACCURACY = 20;
    "MAX_STDDEVIATION_ACCURACY" in filters ? this.MAX_STDDEVIATION_ACCURACY = filters.MAX_STDDEVIATION_ACCURACY : this.MAX_STDDEVIATION_ACCURACY = 2.5;
    "MAX_STDDEVIATION_LAT" in filters ? this.MAX_STDDEVIATION_LAT = filters.MAX_STDDEVIATION_LAT : this.MAX_STDDEVIATION_LAT = 0.0001;
    "MAX_STDDEVIATION_LON" in filters ? this.MAX_STDDEVIATION_LON = filters.MAX_STDDEVIATION_LON : this.MAX_STDDEVIATION_LON = 0.0001;

    var stddev_accuracy = 0, stddev_lat = 0, stddev_lon = 0, stddev_distance = 0;
    var avg_accuracy = 0, avg_lat = 0, avg_lon = 0;
    var avg_distance = 0, avg_speed = 0, avg_timediff = 0;

    var accuracyArray = [];
    var timeStampArray = [];
    var speedArray = [];
    var latArray = [];
    var lonArray = [];
    var distanceArray = []; // an array of distances between each successive lat and lon
    var maxArraySize = 25;

    this.reset = function(){
        timeStampArray = [];
        speedArray = [];
        accuracyArray = [];
        distanceArray = [];
        latArray = [];
        lonArray = [];
    };

    /**
     * All values are required!
     * @param accuracy
     * @param lat
     * @param lon
     * @param timestamp
     * @param callback
     */
    this.rawValues = function(accuracy, lat, lon, timestamp, callback) {

        this.manageArraySize();

        // REJECT any lat lon values if accuracy is greater than our maximum acceptable
        if(accuracy < this.MAX_ACCURACY){

            accuracyArray.push(accuracy);

            avg_accuracy = average(accuracyArray);
            stddev_accuracy = standardDeviation(accuracyArray);
        }

        latArray.push(lat);
        lonArray.push(lon);
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

        avg_lat = average(latArray);
        avg_lon = average(lonArray);
        avg_distance = average(distanceArray);
        stddev_lat = standardDeviation(latArray);
        stddev_lon = standardDeviation(lonArray);
        stddev_distance = standardDeviation(distanceArray);

        filter(accuracy, callback);
    };

    this.filter = function(accuracy, callback) {

        var reject = false;
        var payload = {};

        if (accuracy > this.MAX_ACCURACY) {
            reject = true;
        }
        if (avg_accuracy > this.MAX_AVERAGE_ACCURACY) {
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
        payload.avg_lat = avg_lat;
        payload.avg_lon = avg_lon;
        payload.avg_accuracy = avg_accuracy;
        payload.avg_speed = avg_speed;
        payload.avg_distance = avg_distance;
        payload.stddev_lat = stddev_lat;
        payload.stddev_lon = stddev_lon;
        payload.stddev_accuracy = stddev_accuracy;
        payload.stddev_distance = stddev_distance;

        callback(payload);
    };

    this.manageArraySize = function(){
        // Manage our array size to keep from blowing up memory
        if(accuracyArray.length > maxArraySize){
            accuracyArray.shift();
        }

        if(distanceArray.length > maxArraySize) {
            distanceArray.shift();
        }

        if(latlonArray.length > maxArraySize) {
            latlonArray.shift();
        }

        if(latArray.length > maxArraySize){
            latArray.shift();
        }

        if(lonArray.length > maxArraySize){
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
    }


    /**
     * standardDeviation() and average() functions courtesy of:
     * http://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
     * @param values Array
     * @returns {number}
     */
    this.standardDeviation = function(values) {
        var avg = average(values);

        var squareDiffs = values.map(function(value){
            var diff = value - avg;
            var sqrDiff = diff * diff;
            return sqrDiff;
        });

        var avgSquareDiff = average(squareDiffs);

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

};
