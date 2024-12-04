# Older changes
## 0.5.7 (2021-03-19)
* (DutchmanNL) Change why of password encryption, you my need to re-enter your credentials !
* (DutchmanNL) Bugfix : State "system.this.discovergy.0.alive" has no existing object, this might lead to an error in future versions

## 0.5.6 (2021-03-18)
* (DutchmanNL) Bugfix : Voltage unknown

## 0.5.4 (19-04-2020) Bugfix : Wrong Unit
* (DutchmanNL) Bugfix : Wrong Unit

## 0.5.3 (19-04-2020) Bugfix : change root back to SerialNumber
* (DutchmanNL) Bugfix : Change root of information back to SerialNumber instead of MeterId

## 0.5.2 (18-04-2020) Code improvements
* (DutchmanNL) Optimize and simplify code
* (DutchmanNL) Set calculation factors in attribute definition
* (DutchmanNL) Send information about missing state attribute definitions to sentry

## 0.5.1 (17-04-2020) Avoid writing objects unnecessarily
* (DutchmanNL) Implement Sentry
* (DutchmanNL) Bugfix : Avoid writing objects unnecessarily
* (DutchmanNL) Ensure propper handling of await instead of fire and forget

## 0.5.0 
* (DutchmanNL) Rebuild complete logic of data pulling
* (DutchmanNL) Rewrite adapter to class and support JS-Controller 2.0 with compact mode
* (DutchmanNL) For new Devices : Write error for unknwon states but create device with basic information
* (DutchmanNL) Variable JSON-Array scan for attributes, if Discovergy adds new devices they will be visible immediately

## 0.4.9 Fix wrong readings and make intervall adjustable
* (Dutchman) code cleanup
* (Dutchman) update attr library
* (Dutchman) make state names configurable
* (Dutchman) Implemented adjustable intervall
* (Dutchman) Fix "-" values for power delivery
* (Dutchman) implement adjustable timing intervall
* (Dutchman) Ensure propper reset to 0 of power values

## 0.4.4 ALPHA version of rebuild adapter
* (Dutchman) Rebuild complete logic of data polling
* (Dutchman) make state attributes configurable in library
* (Dutchman) ensure split values for consumption and delivery
* (Dutchman) implement data pulling (needs improvement to avoid block by provider)
* (Dutchman) Rewrite adapter to class and support JS-Controller 2.0 with compact mode
* (Dutchman) For new Devices : Write error for unknown states but create device with basic information
* (Dutchman) Variable JSON-Array scan for attributes, if Discovergy adds new devices they will be visible immediately

## 0.4.0 Stable Release
* small code fixes
* updated dependecys
* release for stable repository

## 0.3.2
* Improved logging
* Seperate supported object definitions from hard code main.js to configuration file "/lib/supported_objects.js"

## 0.3.1
* Stop adapter when username/password is empty and write error message
* Fixed incorrectly created states, time-stamps are also correctly shown now

## 0.3.0
* Implemented encrypted password storage
* Correct error message in LOG when credentials are missing
* Fixed issue with polling of states (this should fix "connection failed" of version 0.2.9)

## 0.2.9
* Small code fixes
* Pull intervall can be configured in Adapter settings
* implemented intervall short and long, only relevant information (current consumption) is pulled short alle other (totals) on interval Long
* Implemented additional datapoints for Power, Power_x_Consumption and Power_x_Delivery, the power value can have a positive and negative number depending of if u consumer or produce for the network. Seperate - and + values to seperated datapoints.

## 0.2.6
* (DutchmanNL) new version published on NPM
* (AlCalzone) code reviewd, several fixes
* (AlCalzone) fixed dependency with package request
* (DutchmanNL) installation now possible by ioBroker Admin

## 0.2.5
* (DutchmanNL) Reduced logging
* (DutchmanNL) Implemented multiple meter support
* (DutchmanNL) implemented "info" object which provides basic information of the device
* (DutchmanNL) Implemented all values which are available by demo-account of discovergy
* (DutchmanNL) Please remove all current objects within tree discoververgy.x, version 0.2.5 introduce device creation by serial number !
* (DutchmanNL) Changed object tree of device from meterId to sererialnumber, please not this means all vallue are now in a different tree
* (DutchmanNL) Remark : not all possbile devices are in the demo, if a device cannot be handled you will get an error message i need that information to implement !

## 0.2.2
* (DutchmanNL) add support for values power1, power2
* (DutchmanNL) add support for values voltage1, voltage1 & voltage3

## 0.2.0
* (DutchmanNL) reduced logging from every 3 seconds to only error if values are received which cannot be handled
* (DutchmanNL) last time step of syncronisation added, currenlty unix time needs to be converted in next release

## 0.1.0
* (DutchmanNL) first working release, data is received every 3 seconds

## 0.0.3
* (DutchmanNL) initial release