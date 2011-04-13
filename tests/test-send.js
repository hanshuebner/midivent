
var MIDI = require('MIDI');

var output = new MIDI.MIDIOutput(undefined, 1);
console.log('opened MIDI output port', output.portName);

output.send('f0 00 01 02 f7');

try {
    output.send([]);
}
catch (e) {
    console.log('expectedly caught error:', e);
}

output.send([0xb0, 90]);

try {
    output.send([0xb0, 90, 1, 2, 3]);
}
catch (e) {
    console.log('expectedly caught error:', e);
}

try {
    output.send({foo: 1});
}
catch (e) {
    console.log('expectedly caught error:', e);
}

try {
    output.sysex([]);
}
catch (e) {
    console.log('expectedly caught error:', e);
}

try {
    output.sysex([0xf0]);
}
catch (e) {
    console.log('expectedly caught error:', e);
}

try {
    output.sysex([0xf0, 1, 2, 3, 0xf7]);
}
catch (e) {
    console.log('expectedly caught error:', e);
}

output.send([0xb0, 1.0, 3.0]);

function sendSomeNotes(channel, basePitch, velocity) {
    output.channel(channel);
    for (var i = 0; i < 3; i++) {
        var pitch = basePitch + i * 12;
        var period = 400;

        output.noteOn(pitch, velocity, i * period);
        output.noteOn(pitch+3, velocity, i * period);
        output.noteOn(pitch+7, velocity, i * period);
        output.noteOn(pitch+10, velocity, i * period);

        output.noteOn(pitch, 0, i * period + 350);
        output.noteOn(pitch+3, 0, i * period + 350);
        output.noteOn(pitch+7, 0, i * period + 350);
        output.noteOn(pitch+10, 0, i * period + 350);

        console.log('sent ' + i);
    }
}

sendSomeNotes(1, 64, 45);

output.controlChange(20, 30);
output.channel(2);
output.controlChange(20, 30);

output.nrpn14(1024, 1024);
output.nrpn7(1024, 127);
try {
    output.nrpn7(1024, 1024);
}
catch (e) {
    console.log('caught expected error:', e);
}

MIDI.at(3000, function () { console.log("should be all done, time is", MIDI.currentTime()); });

process.on('exit', function () { console.log('exiting, current time is', MIDI.currentTime()); });