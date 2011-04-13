
var MIDI = require('MIDI');

var output = new MIDI.MIDIOutput('DSI Tetra');
var input = new MIDI.MIDIInput('DSI Tetra');
var synth = new MIDI.MIDIOutput('Absynth 5 Virtual Input', 1);

input.on('nrpn', function (parameter, value, channel) {
    console.log('parameter', parameter, 'value', value, 'channel', channel);
});
synth.reset();

var x = 0;
input.on('timingClock', function () {
    if ((x % 24) == 0) {
        console.log('timingClock', x);
        synth.noteOn('c2', 127);
    }
    if ((x % 24) == 16) {
        synth.noteOn('c2', 0);
    }
    x++;
});

process.stdin.resume();
