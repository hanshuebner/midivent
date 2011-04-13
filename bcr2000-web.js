var fs = require('fs');
var url = require('url');
var _ = require('underscore');
var BCR2000 = require('BCR2000');

function http_error(message, status) {
    if (!status) {
        status = 500;
    }
    console.log('http_error', status, ':', message);
    resp.writeHead(status, { 'Content-Type': 'text/plain' });
    resp.end(message);
}

function dir (req, resp) {
    resp.writeHead(200, { 'Content-Type': 'application/json'});
    var dir = [];
    _.each(fs.readdirSync("."),
           function (path) {
               path.replace(/(.*).syx$/,
                            function (match, name) {
                                dir.push(name);
                            });
           });
    resp.end(JSON.stringify({ dir: dir }));
}

function get (req, resp, filename) {

    var stats = fs.statSync(filename);
    if (!stats || !stats.isFile()) {
        return http_error("invalid filename: " + filename, 404);
    }

    try {
        var response = BCR2000.readSysexFile(filename);
    }
    catch (e) {
        return http_error("error reading sysex file \"" + filename + "\": " + e, 404);
    }

    resp.writeHead(200, { 'Content-Type': 'application/json'});
    resp.end(JSON.stringify({ preset: response }));
}

function put (req, resp, filename) {
    var buffer = '';
    req.setEncoding('utf-8');
    req.on('data', function (data) {
        buffer += data;
    });
    req.on('end', function () {
        fs.stat(filename, function (error, stats) {
            if ((req.method == 'PUT') && !error) {
                return http_error("can't PUT to existing file \"" + filename + "\"");
            } else {
                var data;
                try {
                    data = JSON.parse(buffer);
                }
                catch (e) {
                    return http_error("cannot parse JSON data: " + e);
                }

                if (!data.preset) {
                    return http_error("uploaded JSON data does not contain a preset field");
                }

                try {
                    BCR2000.writeSysexFile(filename, data.preset);
                }
                catch (error) {
                    return http_error("cannot save data to file \"" + filename + "\": " + error);
                }

                resp.writeHead(200, { 'Content-Type': 'application/json'});
                resp.end(JSON.stringify({ savedTo: filename }));
            }
        });
    });
}
        
exports.handleRequest = function (req, resp, nextHandler) {
    try {
        var path = url.parse(req.url).pathname;
        var args = path.split(/\//);
        args.shift();           // remove leading slash
        if (args[0] == "bcr2000") {
            args.shift();
            if (args[0]) {
                switch (req.method) {
                case 'GET':
                    get(req, resp, args[0] + '.syx');
                    break;
                case 'POST':
                case 'PUT':
                    put(req, resp, args[0] + '.syx');
                    break;
                default:
                    throw "Unsupported request method: " + req.method;
                }
            } else {
                dir(req, resp);
            }
        } else {
            nextHandler(req, resp, null);
        }
    }
    catch (e) {
        resp.writeHead(500, { 'Content-Type': 'text/plain' });
        resp.end('error processing request: ' + e);
    }
}

