var config = {
    listen: {host: 'localhost',
             port: 5555
            },
    talker: {name: "Node"}
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

    var user = new User(client);
    user.addMode(modes.login);
    users.push(user);

    client.on('data', dataHandler);
    client.on('close', removeClient);
    client.on('end', endStream);
    // timeout event to handle as well
});

User.prototype.addMode = function (mode) {
    this.modes.push(mode);
    mode.load(this);
};
User.prototype.print = function (msg) {
    this.conn.write(msg);
};
User.prototype.println = function (msg) {
    this.conn.write(msg + "\n");
};
function User(conn) {
    this.conn = conn;
    this.modes = [];
}

var modes = {
    login: {
        load: function (user) {
            user.print("User Name: ");
        },

        parse: function (user, input) {
            user.name = chomp(input);
            console.log(user.name + '@' + user.conn.remoteAddress + ' connected');
            user.addMode(modes.talk);
            user.println("Welcome to " + config.talker.name + ", " + user.name);
            return -1;
        }
    },

    talk: {
        load: function () {},

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
        users[other].println(msg);
    }
}

function dataHandler (input) {
    var conn = this;
    var user = userForConn(conn);

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
