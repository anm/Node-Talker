var config = {
    listen: {host: 'localhost',
             port: 5555
            }
};
    
/* Remove trailing whitespace */
var chomp = function (s) {
    return /^(.*?)\s*$/.exec(s)[1];
};

var users = [];

var net = require('net');
var server = net.createServer(function (client) {
    // Client is a Stream

    // Decode the data Buffer provided by the data event to a utf8
    // string
    client.setEncoding('utf8');

    client.write("User Name: ");
    client.on('data', dataHandler);
    client.on('close', removeClient);
    client.on('end', endStream);
    // timeout event to handle as well
});

function User(conn) {
    this.conn = conn;
    this.modes = [];
}

var modes = {
    login: {
        parse: function (user, input) {
            user.name = chomp(input);
            console.log(user.name + '@' + user.conn.remoteAddress + ' connected');
            user.modes.push(modes.talk);
            return -1;
        }
    },

    talk: {
        parse: function (user, input) {
            input = chomp(input);
            modes.talk.say(user, input);
            return 1;
        },
        
        say: function (user, msg) {
            var out = user.name + ': ' + msg;
            wall(out);
        }
    }
};

function wall(msg) {
    var other;
    for (other in users) {
        users[other].conn.write(msg + "\n");
    }
}

function dataHandler (input) {
    var conn = this;
    var user = userForConn(conn);
    if (user === null) {
        user = new User(conn);
        user.modes.push(modes.login);
        users.push(user);
    }

    var i;
    var status;
    for (i = user.modes.length - 1; i >= 0; --i) {
        status = user.modes[i].parse(user, input);
        switch (status) {
        case -1:
            // Remove handler and stop
            // TODO: remove
            user.modes.splice(i, 1);
            return;
            break;
        case 0:
            // Defer
            break;
        case 1:
            // Done
            return;
            break;
        }
    }

    throw new Error("No mode would handle the user input");
}

function newName (name) {
    this.removeListener('data', newName);
    this.on('data', say);
}
   
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

server.on('error', function (e) {console.err(e)});

server.listen(config.listen.port, config.listen.host, function () {
    console.log("Listening on " + config.listen.host + " " + config.listen.port)});
