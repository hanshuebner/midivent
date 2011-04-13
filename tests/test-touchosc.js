var http = require('http'),
    io = require('socket.io'),
    osc = require('osc');

server = http.createServer(function(req, res){ 
    res.writeHead(200, {'Content-Type': 'text/html'}); 
    res.end('<h1>Hello world</h1>'); 
});

server.listen(4040);

var io = io.listen(server);

var OSCclient = new osc.Client(4344, '192.168.5.153');

// tell to lp that it should send messages to us at localhost:4343
OSCmsg = new osc.Message('/1');
OSCclient.send(OSCmsg);

// so let's start to listen on 4343
var OSCserver = new osc.Server(4343);

OSCserver.on('message', function (message, sender) {
    console.log('message', message, 'sender', sender);
});

