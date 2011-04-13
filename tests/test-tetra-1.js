
var MIDI = require('./build/default/MIDI.node');

var output = new MIDI.MIDIOutput('DSI Tetra');
var input = new MIDI.MIDIInput('DSI Tetra');

input.recv(function (messages) {
    if (messages.length > 1) {
        console.log('more than one message, unexpected');
        return;
    }
    var message = messages[0];
    var str = '';
    for (i in message) {
        str += ' ' + message[i].toString(16);
    }
    console.log('message length: ' + message.length + ' message:' + str);
    var globalParameterName = ['master transpose',
                               'master fine tune',
                               'midi channel',
                               'poly chain',
                               'midi clock source',
                               'local control',
                               'parameter send',
                               'parameter receive',
                               'midi controller send/receive',
                               'midi sysex send/receive',
                               'audio out',
                               'balance tweak',
                               'pot mode',
                               'midi out select',
                               'multi mode',
                               'layer',
                               'program/combo',
                               'select voice'];
    for (i = 4; i < message.length; i += 2) {
        var value = message[i] + (message[i + 1] << 4);
        var index = ((i - 4) / 2);
        console.log(globalParameterName[index] + ": " + value);
    }
});

output.send('f0 01 26 0e f7');

