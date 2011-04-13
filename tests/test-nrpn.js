
var MIDI = require('MIDI');

var midiInput = new MIDI.MIDIInput();
console.log("opened MIDI input port", midiInput.portName);

midiInput.on('nrpn14', function (nrpn, value, channel) {
    console.log('nrpn14', nrpn, 'value', value, 'channel', channel);
});
try {
    midiInput.on('nrpn7', function (nrpn, value, channel) {
        console.log('nrpn7', nrpn, 'value', value, 'channel', channel);
    });
}
catch (e) {
    console.log("caught expected error:", e);
}