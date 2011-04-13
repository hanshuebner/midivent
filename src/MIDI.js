// MIDI.js - MIDI interface for node.js, based on the portmidi
// cross-platform MIDI library

// Copyright Hans Huebner and contributors. All rights reserved.
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy,
// modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

var MIDI = require('MIDI.node');
var _ = require('underscore');

for (var i in MIDI) {
    exports[i] = MIDI[i];
}

// //////////////////////////////////////////////////////////////////////
// MIDIOutput functionality
// //////////////////////////////////////////////////////////////////////

// MIDI message definitions

// The filterBit key defines PortMIDI Filter bit mask definitions - A
// set bit means that the corresponding messages are filtered
// Translated from portmidi.h.

// The arguments key defines how many arguments the message type has.
// If it is undefined, a specialized function exists to send messages
// of that type.

var midiMessageDefs = {
    noteOff:               { statusCode: 0x80, filterBit: (1 << 0x18) },
    noteOn:                { statusCode: 0x90, filterBit: (1 << 0x19) },
    polyphonicKeyPressure: { statusCode: 0xa0, filterBit: (1 << 0x1a), arguments: 2 },
    controlChange:         { statusCode: 0xb0, filterBit: (1 << 0x1b), arguments: 2 },
    programChange:         { statusCode: 0xc0, filterBit: (1 << 0x1c), arguments: 1 },
    channelPressure:       { statusCode: 0xd0, filterBit: (1 << 0x1d), arguments: 1 },
    pitchWheelChange:      { statusCode: 0xe0, filterBit: (1 << 0x1e) },
    sysex:                 { statusCode: 0xf0, filterBit: (1 << 0x00) },
    midiTimeCode:          { statusCode: 0xf1, filterBit: (1 << 0x01), arguments: 1 },
    songPositionPointer:   { statusCode: 0xf2, filterBit: (1 << 0x02), arguments: 2 },
    songSelect:            { statusCode: 0xf3, filterBit: (1 << 0x03), arguments: 1 },
    tuneRequest:           { statusCode: 0xf6, filterBit: (1 << 0x06), arguments: 0 },
    timingClock:           { statusCode: 0xf8, filterBit: (1 << 0x08), arguments: 0 },
    tick:                  { statusCode: 0xf9, filterBit: (1 << 0x09), arguments: 0 },
    start:                 { statusCode: 0xfa, filterBit: (1 << 0x0a), arguments: 0 },
    stop:                  { statusCode: 0xfb, filterBit: (1 << 0x0c), arguments: 0 },
    continue:              { statusCode: 0xfc, filterBit: (1 << 0x0b), arguments: 0 },
    activeSensing:         { statusCode: 0xfe, filterBit: (1 << 0x0e), arguments: 0 },
    reset:                 { statusCode: 0xff, filterBit: (1 << 0x0f), arguments: 0 }
};

// Compose a MIDI status code for a channel message consisting of a
// message type and a channel number.
function makeStatusCode(messageType, channel) {
    var statusCode = midiMessageDefs[messageType].statusCode;
    var channel = channel ? (channel - 1) : 0;
    return statusCode | (((statusCode & 0xf0) != 0xf0) ? channel : 0);
}

// Generate a convenience function for the messageType given
function makeHandler(messageType) {
    switch (midiMessageDefs[messageType].arguments) {
    case 0:
        return function (time) {
            if (arguments.length > 1) {
                throw "unexpected number of arguments to " + messageType;
            }
            this.send([ makeStatusCode(messageType, this.channel() - 1) ],
                      time);
        }
        break;
    case 1:
        return function (arg, time) {
            if (arguments.length < 1 || arguments.length > 2) {
                throw "unexpected number of arguments to " + messageType;
            }
            this.send([ makeStatusCode(messageType, this.channel() - 1), arg ],
                      time);
        }
        break;
    case 2:
        return function (arg1, arg2, time) {
            if (arguments.length < 2 || arguments.length > 3) {
                throw "unexpected number of arguments to " + messageType;
            }
            this.send([ makeStatusCode(messageType, this.channel() - 1), arg1, arg2 ],
                      time);
        }
        break;
    }
}

// Generate convenience functions for every defined MIDI message
for (var messageType in midiMessageDefs) {
    if (midiMessageDefs[messageType].arguments != undefined) {
        MIDI.MIDIOutput.prototype[messageType] = makeHandler(messageType);
    }
}

// Define functions for those message types that require more argument
// processing than the autogenerated convenience function can provide.

MIDI.MIDIOutput.prototype.sysex = function (data, time) {
    if (typeof data == 'string') {
        data = _.map(data.split(/ +/), function (string) { return parseInt(string, 16); });
    }
    if (data[0] != 0xf0 || data[data.length - 1] != 0xf7) {
        throw "invalid sysex message, must start with 0xf0 and end with 0xf7";
    }
    this.send(data, time);
}

var noteNames = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];
var noteNameToOffset = {};
for (var i in noteNames) {
    noteNameToOffset[noteNames[i]] = parseInt(i);
}

function noteToPitch(noteName) {
    var pitch;
    noteName.replace(/^([A-Ga-g]#?)(-?[0-9])$/, function (dummy, name, octave) {
        pitch = (12 * octave) + noteNameToOffset[name.toUpperCase()] + 24;
    });
    if (pitch == undefined) {
        throw "invalid note name " + noteName;
    }
    return pitch;
}

function pitchToNote(pitch) {
    return noteNames[pitch % 12] + (Math.floor(pitch / 12) - 2).toString();
}

exports.noteToPitch = noteToPitch;
exports.pitchToNote = pitchToNote;

MIDI.MIDIOutput.prototype.channel = function (channel) {
    if (arguments.length) {
        if ((typeof channel != 'number')
            || (channel < 1)
            || (channel > 16)) {
            throw "invalid channel argument: " + channel + " - expecting a number between 1 and 16";
        }
        this._channel = channel;
    } else if (this._channel == undefined) {
        // lazy initialization
        this._channel = 1;
    }
    return this._channel;
}

function makeNoteMessageFunction(messageType) {
    return function (note, velocity, time) {
        var parsedNote = parseInt(note);
        if (isNaN(parsedNote)) {
            parsedNote = noteToPitch(note);
        }
        this.send([ makeStatusCode(messageType, this.channel() - 1), parsedNote, velocity ], time);
    }
}

MIDI.MIDIOutput.prototype.noteOn = makeNoteMessageFunction('noteOn');
MIDI.MIDIOutput.prototype.noteOff = makeNoteMessageFunction('noteOff');

MIDI.MIDIOutput.prototype.nrpn7 = function (parameter, value, time) {

    this.controlChange(0x63, parameter >> 7, time);
    this.controlChange(0x62, parameter & 0x7f, time);
    if (value > 0x7f) {
        throw "cannot send 7 bit nrpn for values > 0x7f";
    }
    this.controlChange(0x06, value, time)
}

MIDI.MIDIOutput.prototype.nrpn14 = function (parameter, value, time) {

    this.controlChange(0x63, parameter >> 7, time);
    this.controlChange(0x62, parameter & 0x7f, time);
    this.controlChange(0x06, value >> 7, time);
    this.controlChange(0x26, value & 0x7f, time);
}

MIDI.MIDIOutput.prototype.pitchWheelChange = function (value, time) {
    if (value > 0x1fff || value < -0x2000) {
        throw "invalid pitch wheel change amount, must be between -8192 and 8191";
    }
    value += 0x2000;
    this.send([ makeStatusCode(0xe0, this.channel() - 1), value & 0x7f, (value >> 7) ], time);
}

// //////////////////////////////////////////////////////////////////////
// MIDIInput functionality
// //////////////////////////////////////////////////////////////////////

// Translate a message, represented as array of integers, into a
// string of space separated 8 bit hex values.

function messageToString(message) {
    var asString = '';
    for (var j = 0; j < message.length; j++) {
        if (j > 0) {
            asString += ' ';
        }
        asString += message[j].toString(16);
    }
    return asString;
}

exports.messageToString = messageToString;

MIDI.MIDIInput.prototype.recvText = function(callback) {
    this.recv(function (midiInput, data) {
        var stringData = [];
        for (var i in data) {
            stringData.push(messageToString(data[i]));
        }
        callback(midiInput, stringData);
    });
}

// This function is called from the low-level library interface to
// translate received MIDI messages into events that are delivered to
// the application.
function generateEvents(midiInput, messages, error)
{
    if (error) {
        midiInput.emit('error', error);
        return;
    }
    for (var i in messages) {
        var message = messages[i];
        if (message.length < 2) {
            console.log('short message ignored, message:', message);
            continue;
        }
        var time = message[0];
        var status = message[1];
        var arg1 = message[2];
        var arg2 = message[3];
        var channel = (status & 0x0f) + 1;
        switch (status & 0xf0) {
        case 0x80:
            midiInput.emit('noteOff', arg1, arg2, channel, time);
            break;
        case 0x90:
            midiInput.emit('noteOn',  arg1, arg2, channel, time);
            break;
        case 0xA0:
            midiInput.emit('polyphonicKeyPressure',  arg1, arg2, channel, time);
            break;
        case 0xB0:
            midiInput.emit('controlChange',  arg1, arg2, channel, time);
            break;
        case 0xC0:
            midiInput.emit('programChange', arg1, channel, time);
            break;
        case 0xD0:
            midiInput.emit('channelPressure', arg1, channel, time);
            break;
        case 0xE0:
            value = 0x2000 - ((arg2 << 7) | arg1);
            midiInput.emit('pitchWheelChange',  value, channel, time);
            break;
        case 0xF0:
            switch (status & 0x0f) {
            // system common messages
            case 0x00:
                midiInput.emit('sysex', message.slice(1), time);
                break;
            case 0x01:
                midiInput.emit('midiTimeCode', arg1, time);
                break;
            case 0x02:
                midiInput.emit('songPositionPointer', arg1, arg2, time);
                break;
            case 0x03:
                midiInput.emit('songSelect', arg1, time);
                break;
            case 0x04:
            case 0x05:
                console.log("unexpected MIDI message code 0x" + status.toString(16));
                break;
            case 0x06:
                midiInput.emit('tuneRequest', time);
                break;
            case 0x07:
                console.log("unexpected end of sysex byte at the beginning of a message");
                break;
            // system real time messages
            case 0x08:
                midiInput.emit('timingClock', time);
                break;
            case 0x09:
                midiInput.emit('tick', time);
                break;
            case 0x0A:
                midiInput.emit('start', time);
                break;
            case 0x0B:
                midiInput.emit('continue', time);
                break;
            case 0x0C:
                midiInput.emit('stop', time);
                break;
            case 0x0D:
                console.log("unexpected system real time message 0x" + status.toString(16));
                break;
            case 0x0E:
                midiInput.emit('activeSensing', time);
                break;
            case 0x0F:
                midiInput.emit('reset', time);
            }
            break;
        default:
            console.log("illegal MIDI message status code 0x" + status.toString(16));
        }
    }
            
    midiInput.recv(arguments.callee);
}

function NRPN(is14Bit) {
    this.is14Bit = is14Bit;
    this.parameterMsb = 0;
    this.parameterLsb = 0;
    this.valueMsb = 0;
    this.valueLsb = 0;
}

NRPN.prototype.parameter = function () {
    return this.parameterMsb << 7 | this.parameterLsb;
}

NRPN.prototype.value = function () {
    if (this.is14Bit) {
        return this.valueMsb << 7 | this.valueLsb;
    } else {
        return this.valueMsb;
    }
}

NRPN.prototype.increment = function (delta) {
    if (this.is14Bit) {
        var value = this.value() + delta;
        if (value < 0) {
            value = 0;
        } else if (value > 0x3fff) {
            value = 0x3fff;
        }
        this.valueLsb = value & 0x7f;
        this.valueMsb = (value >> 7);
    } else {
        this.valueMsb += delta;
        if (this.valueMsb < 0) {
            this.valueMsb = 0;
        } else if (this.valueMsb > 0x7f) {
            this.valueMsb = 0x7f;
        }
    }
}

NRPN.prototype.clearValue = function () {
    this.valueMsb = 0;
    this.valueLsb = 0;
}

NRPN.prototype.clear = function () {
    this.parameterMsb = 0;
    this.parameterLsb = 0;
    this.clearValue();
}

function processNrpn(controllerNumber, value, channel, time) {
    // console.log('controllerNumber', controllerNumber.toString(16), 'value', value, 'channel', channel, 'nrpn', this.nrpn);
    var nrpn = this.nrpn;
    switch (controllerNumber) {
    case 0x63:
        nrpn.parameterMsb = value;
        nrpn.clearValue();
        break;
    case 0x62:
        nrpn.parameterLsb = value;
        if (nrpn.parameter() == 0x3fff) {
            this.nrpn.clear();
        } else {
            nrpn.clearValue();
        }
        break;
    case 0x06:
        nrpn.valueMsb = value;
        if (!nrpn.is14Bit) {
            this.emit('nrpn7', nrpn.parameter(), nrpn.value(), channel, time);
        }
        break;
    case 0x26:
        nrpn.valueLsb = value;
        // If LSB value is received in 7 bit mode, it is just ignored.
        if (nrpn.is14Bit) {
            this.emit('nrpn14', nrpn.parameter(), nrpn.value(), channel, time);
        }
        break;
    case 0x60:
        nrpn.increment(value);
        this.emit('nrpn14', nrpn.parameter(), nrpn.value(), channel, time);
        break;
    case 0x61:
        nrpn.increment(-value);
        this.emit('nrpn14', nrpn.parameter(), nrpn.value(), channel, time);
        break;
    }
}

MIDI.MIDIInput.prototype.init = function()
{
    if (!this.listening) {
        this.listening = true;

        this.currentFilter = 0x7fffffff;

        (function (midiInput) {
            midiInput.on('newListener', function (type, listener) {
                // If event being listened for is a MIDI message event
                if (midiMessageDefs[type] && midiMessageDefs[type].filterBit) {
                    // ... reset the filter bit corresponding to the event type in the MIDI listener
                    midiInput.currentFilter &= ~midiMessageDefs[type].filterBit;
                    midiInput.setFilters(midiInput.channelMask, midiInput.currentFilter);
                }
                // If listener is interested in the nrpn event, enable nrpn processing
                if ((type == 'nrpn14' || type == 'nrpn7')) {
                    var is14bit = (type == 'nrpn14');
                    if (midiInput.nrpn && (midiInput.nrpn.is14bit != is14bit)) {
                        throw "cannot listen to 7 and 14 bit nrpn control changes at the same time";
                    }
                    midiInput.nrpn = new NRPN(is14bit);
                    midiInput.on('controlChange', _.bind(processNrpn, midiInput));
                }
            });
        })(this);

        this.recv(generateEvents);
    }

    this.channels(0);
}

MIDI.MIDIInput.prototype.channels = function(argument)
{
    function channelToBit(channel) {
        return (1 << (channel - 1));
    }

    if (typeof argument == 'array') {
        var channels = argument;
        this.channelMask = 0;
        _.each(channels, function (channel) {
            this.channelMask |= channelToBit(channel);
        });
    } else if (typeof argument == 'number') {
        if (argument == 0) {
            this.channelMask = 0xffff;
        } else {
            this.channelMask = channelToBit(argument);
        }
    } else if (argument != undefined) {
        throw "unexpected channel argument " + argument;
    }

    this.setFilters(this.channelMask, this.currentFilter);

    var retval = [];

    _.each(_.range(0, 16), function (bit) {
        if (this.channelMask & (1 << bit)) {
            retval.push(bit + 1);
        }
    });

    return retval;
}

MIDI.MIDIInput.prototype.stopListening = function()
{
    if (this.listening) {
        this.listening = false;
        this.setFilters(0xffff, 0x7fffffff);
    }
}