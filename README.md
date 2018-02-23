html5-geolocation-tool-js
=========================

Includes two apps for testing browser-based geolocation on different devices. It lets you track your location as well as play with the different Geolocation API properties. This can be used on a desktop browser, mobile browser or within a PhoneGap project.

**[index.html](https://esri.github.io/html5-geolocation-tool-js/)** - let's you experiment with all the different settings as well as accumulating track points.

**[field-location-template.html](https://esri.github.io/html5-geolocation-tool-js/field-location-template.html)** - is an experimental mobile app that demonstrates one approach to helping field workers determine the best single location. The app uses visual clues, 
averaging and center point averaging. It's built using bootstrap.

## Geolocation Tool

Main View:

![App](https://raw.github.com/Esri/html5-geolocation-tool-js/master/html5geolocation_downtown_denver_360w.png)

Settings View:

![App](https://raw.github.com/Esri/html5-geolocation-tool-js/master/html5geolocation_downtown_denver_settings_360w.png)

Settings View (cont'd):

![App](https://raw.github.com/Esri/html5-geolocation-tool-js/master/html5geolocation_downtown_denver_settings2_360w.png)

## Field Location Template

Main View:

![App](https://raw.github.com/Esri/html5-geolocation-tool-js/master/field-location-template-main.png)

View 2:

![App](https://raw.github.com/Esri/html5-geolocation-tool-js/master/field-location-template-2.png)

View 3:

![App](https://raw.github.com/Esri/html5-geolocation-tool-js/master/field-location-template-3.png)

## Features for Geolocation Tool

* Displays location on map.
* Displays HTML5 geolocation properties (e.g. lat/lon, timestamp, etc)
* Let's you configure and try out different scenarios by changing the geolocation properties.
* Modify geolocation properties via the Settings menu.

## Features for Field Location Template

* Displays geolocation accuracy circle
* Shows size of post-processing buffer
* Gives visual cues as whether current location is good (green), so-so (yellow), or bad (red).
* Shows averaged center location and its associated lat/lon
* Shows accumulated points
* Adjustable number of locations to post-process

## Requirements

* Internet browser: desktop, laptop, phone or tablet
* Mapping Library [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/)
* Internet connection by ethernet, cellular network and/or Wifi
* Experience with HTML/JavaScript.

## Licensing
Copyright 2018 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](http://www.apache.org/licenses/LICENSE-2.0) file.