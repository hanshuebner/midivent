var MIDI = require('MIDI');
var o = new MIDI.MIDIOutput();
setTimeout(function () {
    console.log('timeout');
}, 2);