![alt text](https://raw.githubusercontent.com/DutchmanNL/ioBroker.discovergy/master/admin/Discovergy_logo.png)

# ioBroker.discovergy

This is an ioBroker adapter for your Discovergy Power meassurement meter.
It uses the Discovergy API to read data of your meters and syncronise it's current values to ioBroker.

https://api.discovergy.com/docs/

Please note : This is my first adapter and currenlty (04-12-2018) is Alpha state !

Please feel free to add issue for your wanted funktionality or problems you see so i can take a look at it !

## To-Do

Core-Functionality
* Multiple Meter support, currently only one Meter is handled
* Translations 

Backend
* Implement better error handling
* handle more code in functions
* code cleanup
* store password encrypted
* Log more data into states
* better handling of state creation and updates

## Changelog

0.2.2
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
