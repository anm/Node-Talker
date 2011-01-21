var chomp = function (s) {
    return /^(.*?)\s*$/.exec(s)[1];
};

var users = [];

var net = require('net');
var server = net.createServer(function (client) {
    // Client is a Stream

    // Decodes the data Buffer provided by the data event to a utf8
    // string
    client.setEncoding('utf8');

    client.write("User Name: ");
    client.on('data', newName);
    client.on('close', removeClient);
    client.on('end', endStream);
    // timeout event to handle as well
});

function endStream() {
    this.end();
}

function removeClient() {
    var conn = this;
    console.log("Disconnected: " + this.remoteAddress);
    var i;
    for (i = 0; i < users.length; ++i) {
        if (users[i].conn === conn) {
            var name = users[i].name;
            users.splice(i, 1);
            wall(name + " disconnected");
            return;
        }
    }
    console.log("Disconnected stream not associated with any user");
}

function userForConn (conn) {
    for (i = 0; i < users.length; ++i) {
        if (users[i].conn === conn) {
            return users[i];
        }
    }
    return null;
}

function newName (name) {
    name = chomp(name);
    users.push({name: name, conn:this});
    console.log(name + '@' + this.remoteAddress + ' connected');
    this.removeListener('data', newName);
    this.on('data', say);
}

function say (msg) {
    var user = userForConn(this).name;
    var out = user + ': ' + msg;
    wall(out);
}

function wall(msg) {
    var other;
    for (other in users) {
        console.log(other);
        users[other].conn.write(msg);
    }
}

server.on('error', function (e) {console.err(e)});

server.listen(5555, 'localhost', function () {console.log("Listening")});
