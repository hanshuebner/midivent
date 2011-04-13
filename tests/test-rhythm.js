var MIDI = require('MIDI');

var output = new MIDI.MIDIOutput(undefined, 1);
console.log('opened MIDI output port', output.portName);

var kick =  [ 'c1', 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1 ];
var snare = [ 'd1', 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0 ];
var hats =  [ 'd2', 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0 ];

function playRhythm(specs, times, base, tempo) {
    var sixteenth = 60000 / tempo / 4;
    for (var count = 0; count < times; count++) {
        for (var i = 1; i <= 16; i++) {
            var noteStart = base + (count * 16 * sixteenth) + i * sixteenth;
            for (track = 0; track < specs.length; track++) {
                if (specs[track][i]) {
                    output.noteOn(specs[track][0], 127, noteStart);
                }
            }
            noteStart += sixteenth / 2
            for (track = 0; track < specs.length; track++) {
                if (specs[track][i]) {
                    output.noteOn(specs[track][0], 0, noteStart);
                }
            }
        }
    }
    return base + (times * 16 * sixteenth);
}

var baseTime = MIDI.currentTime() + 100;
var end = playRhythm([kick, snare, hats], 2, baseTime, 125);
playRhythm([kick, snare, hats], 2, end, 150);
