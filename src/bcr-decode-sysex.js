var fs = require('fs');

var buf = fs.readFileSync(process.argv[2]);
for (var i = 0; i < buf.length; ) {
    if (buf[i] != 0xf0) {
        throw "expected sysex begin";
    }
    var j;
    for (j = i; buf[j] != 0xf7; j++)
        ;
    decodeOneMessage(buf.slice(i, j));
    i = j + 1;
}

function decodeOneMessage(buf) {
    if (buf[0] != 0xf0
        || buf[1] != 0x00
        || buf[2] != 0x20
        || buf[3] != 0x32) {
        throw "not a Behringer sysex message";
    }
    if (buf[6] == 0x20) {
//        process.stdout.write(((buf[7] << 7) + buf[8]).toString() + ' ')
        process.stdout.write(buf.slice(9, buf.length));
        process.stdout.write("\n");
    }
}