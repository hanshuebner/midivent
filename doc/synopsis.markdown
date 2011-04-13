# jsm - MIDI library for node

jsm makes a system's MIDI ports accessible to node applications.  It
uses the [portmidi](http://sourceforge.net/projects/portmedia)
cross-platform media library, so it should work on MacOS, Windows and
Linux.

jsm is designed to make it easy for node applications to send and
receive MIDI messages.  It was initially developed to implement
flexible interfaces between control surfaces and synthesizers.
Efficiency is a concern, too, but at this stage, there is no provision
to make strict timing promises.  This means that while it is possible
to generate note messages, jitter and latency cannot be controlled
tightly yet.

## Sending MIDI messages

This is an example of a program that sends a few MIDI control
messages:

    var MIDI = require('MIDI');

    var midiOutput = new MIDI.MIDIOutput();
    console.log("opened MIDI output port", midiOutput.portName);

    midiOutput.channel(3);              // Set output channel 3
    midiOutput.controlChange(0, 10);    // Select bank 10 (CC0)
    midiOutput.channel(4);              // Set output channel 4
    midiOutput.controlChange(7, 80);    // Set volume to 80 (CC7)

## Receiving MIDI messages

This is an example of a program that receives MIDI noteOn messages and
prints them to the console:

    var MIDI = require('MIDI');
    
    var midiInput = new MIDI.MIDIInput();
    console.log("opened MIDI input port", midiOutput.portName);

    midiInput.on('noteOn',
                 function (pitch, velocity, channel) {
                     console.log('note', MIDI.pitchToNote(pitch),
                                 'velocity', velocity,
                                 'channel', channel);
                 });
