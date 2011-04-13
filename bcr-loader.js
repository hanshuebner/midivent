var MIDI = require('MIDI');
var BCR2000 = require('bcr2000');
var fs = require('fs');

var bcrInput = new MIDI.MIDIInput('BCR2000');
var bcrOutput = new MIDI.MIDIOutput('BCR2000');

function sendBcl(string) {

    // array of BCL strings to send to the BCR2000
    var bclToSend = string.split('\n');

    function sendBclLine(lineNumber)
    {
        var line = bclToSend[lineNumber];
        var sysex = [0xf0, 0x00, 0x20, 0x32, 0x00, 0x15,
                     0x20, ((lineNumber >> 7) & 0x7f), (lineNumber & 0x7f)]
        for (var i = 0; i < line.length; i++) {
            sysex.push(line.charCodeAt(i));
        }
        sysex.push(0xf7);
        bcrOutput.sysex(sysex);
    }

    function handleReceivedBclReply(message)
    {
        var lineNumber = (message[7] << 7) | message[8];
        var errorCode = message[9];

        if (errorCode) {
            console.log('BCR2000 reported error', errorCode, 'for line number', lineNumber);
        } else if (lineNumber + 1 < bclToSend.length) {
            lineNumber++;
            sendBclLine(lineNumber);
        } else {
            console.log('done');
            bcrInput.removeAllListeners('sysex');
        }
    }

    // Handle a standard Behringer sysex message that has been received.
    function handleBehringerSysex(message) {
        switch (message[6]) {
        case 0x20:
            handleReceivedBclLine(message);
            break;
        case 0x21:
            switch (message.length) {
            case 11:
                // BCL Reply
                handleReceivedBclReply(message);
                break;
            case 33:
                // Send Preset Name
                break;
            default:
                console.log('received $21 message with unexpected length', message.length, message);
                break;
            }
            break;
        default:
            console.log('unknown Behringer sysex message received, command:', message[6]);
        }
    }

    bcrInput.on('sysex', handleBehringerSysex);
    sendBclLine(0);
}

bclFilename = process.argv[2];

var buf = fs.readFileSync(bclFilename);
if (buf[0] == 0xf0 && buf[1] == 0x00 && buf[2] == 0x20 && buf[3] == 0x32) {
    sendBcl(BCR2000.sysexToBcl(buf));
} else if (buf.toString('ascii', 0, 4) == "$rev") {
    sendBcl(buf.toString('ascii'));
} else {
    console.log('could not identify file type of', bclFilename);
}