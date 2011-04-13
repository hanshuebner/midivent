var MIDI = require('MIDI');

var i = 0;
var baseTime = MIDI.currentTime();
function checkAndRequeue(timestamp)
{
    console.log('at', timestamp, 'current', MIDI.currentTime());
    if (i++ < 10) {
        MIDI.at(baseTime + i * 100, checkAndRequeue);
    }
}

checkAndRequeue(MIDI.currentTime());

MIDI.at(baseTime + 2300, function () { console.log('three'); });
MIDI.at(baseTime + 2200, function () { console.log('two'); });
MIDI.at(baseTime + 2100, function () { console.log('one'); });

