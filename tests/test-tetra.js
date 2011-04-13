
var MIDI = require('./build/default/MIDI.node');

var output = new MIDI.MIDIOutput('DSI Tetra');
var input = new MIDI.MIDIInput('DSI Tetra');

var sendMessages =
    [ 'f0 01 26 0e f7',                                     // request global parameters
      'f0 01 26 06 f7',                                     // request edit buffer dump
      'f0 01 26 38 f7'                                      // request combo edit buffer dump
    ];

function request(messagesToSend)
{
    var message = messagesToSend.shift();
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
        if (messagesToSend.length) {
            request(messagesToSend);
        }
    });
    console.log('send: ' + message);
    output.send(message);
}

request(sendMessages);

