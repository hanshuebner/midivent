
var MIDI = require('MIDI');

var midiInput = new MIDI.MIDIInput();
console.log("opened MIDI input port", midiInput.portName);

midiInput.on('sysex', function (message, time) {
    console.log('sysex:', MIDI.messageToString(message), 'time', time);
});
midiInput.on('timingClock', function (time) {
    console.log('timingClock', 'time', time);
});
midiInput.on('controlChange', function (controller, value, channel, time) {
    console.log('controlChange: controller', controller, 'value', value, 'channel', channel, 'time', time);
});


