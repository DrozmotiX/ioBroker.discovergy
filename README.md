![alt text](https://raw.githubusercontent.com/DutchmanNL/ioBroker.discovergy/master/admin/Discovergy_logo.png)

# ioBroker.discovergy

This is an ioBroker adapter for your Discovergy Power meassurement meter.
It uses the Discovergy API to read data of your meters and syncronise it's current values to ioBroker.

https://api.discovergy.com/docs/

Please feel free to add issue for your wanted funktionality or problems you see so i can take a look at it !

Remark : I dont have all possbile devices and also the demo-account does not provide all existing values devices can provide.
If you receive the following error :

				Information received from Discovergy which is not yet part of this adapter"
				"Send this information to developer : xxxxx

Please go to your logfile and download it, create an issue here on github with the provided values.
Do not copy-paste from Admin webinterface, information is missing here which i need !

You can test this adapter by using the demo credentials of discovergy (or with your own :-)):
username = demo@discovergy.com
pass = demo

## To-Do

Core-Functionality
* Adjustable polling invervall
* Better interface for adapter configuration
* Translations 

Backend
* store password encrypted
* better handling of state creation and updates

## Changelog

### 0.2.5
* (Dutchman) Please remove all current objects within tree discoververgy.x, version 0.2.5 introduce device creation by serial number !
* (Dutchman) Changed object tree of device from meterId to sererialnumber, please not this means all vallue are now in a different tree
* (Dutchman) Implemented multiple meter support
* (Dutchman) implemented "info" object which provides basic information of the device
* (Dutchman) Implemented all values which are available by demo-account of discovergy
* (Dutchman) Remark : not all possbile devices are in the demo, if a device cannot be handled you will get an error message i need that information to implement !
* (Dutchman) Reduced logging

### 0.2.2
* (Dutchman) add support for values voltage1, voltage1 & voltage3
* (Dutchman) add support for values power1, power2

### 0.2.0
* (Dutchman) reduced logging from every 3 seconds to only error if values are received which cannot be handled
* (Dutchman) last time step of syncronisation added, currenlty unix time needs to be converted in next release

### 0.1.0
* (Dutchman) first working release, data is received every 3 seconds

### 0.0.3
* (Dutchman) initial release

## Contributors
* AlCalzone
* zoernert

## License
MIT License

Copyright (c) 2018 Dutchman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
