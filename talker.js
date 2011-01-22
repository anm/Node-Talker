var config = {
    listen: {host: undefined, // undefined to listen on all addresses
             port: 5555
            },
    talker: {name: "Node"}
};

/* Remove trailing whitespace */
var chomp = function (s) {
    return /^(.*?)\s*$/.exec(s)[1];
};

Users.prototype.all = function () {
    return this.list;
};

Users.prototype.forConn = function (conn) {
    for (i = 0; i < this.list.length; ++i) {
        if (this.list[i].conn === conn) {
            return this.list[i];
        }
    }
    return null;
};

Users.prototype.forName = function (name) {
    for (i = 0; i < this.list.length; ++i) {
        if (this.list[i].name === name) {
            return this.list[i];
        }
    }
    return null;
};

Users.prototype.add = function (user) {
    this.list.push(user);
};

Users.prototype.remove = function (conn) {
    var i;
    for (i = 0; i < this.list.length; ++i) {
        if (this.list[i].conn === conn) {
            var name = this.list[i].name;
            this.list.splice(i, 1);
            wall(name + " disconnected");
            return;
        }
    }
    console.log("Disconnected stream not associated with any user");
};

function Users () {
    this.list = [];
}

var users = new Users();

var net = require('net');
var server = net.createServer(function (client) {
    // Client is a Stream

    // Decode the data Buffer provided by the data event to a utf8
    // string
    client.setEncoding('utf8');

    var user = new User(client);
    user.addMode(modes.login);
    users.add(user);

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
    this.modes = [modes.base];
}

var modes = {
    base: {
        load: function () {},
        parse: function (user, input) {
            input = chomp(input);
            if (input === "time") {
                user.println(new Date().toLocaleTimeString());
            } else {
                user.println("?");
            }
            return 1;
        }
    },

    login: {
        load: function (user) {
            user.print("User Name: ");
        },

        parse: function (user, input) {
            var name = chomp(input);
            if (! /^[A-Za-z0-9]+[A-Za-z0-9_]+$/.test(name)) {
                user.println("Name may contain only letters, numbers and a non-leading underscore")
                user.print("User Name: ");
                return 1;
            }
            if (users.forName(name)) {
                user.println("Name in use.");
                user.print("User Name: ");
                return 1;
            }
            user.name = name;
            console.log(logID(user) + ' connected');
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
    var ul = users.all();
    for (other in ul) {
        ul[other].println(msg);
    }
}

function dataHandler (input) {
    var conn = this;
    var user = users.forConn(conn);

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

function logID (user) {
    return user.name + '@' + user.conn.remoteAddress + ":" + user.conn.remotePort;
}

function endStream() {
    this.end();
}

function removeClient() {
    var conn = this;
    var user = users.forConn(conn);
    console.log("Disconnected: " + logID(user));
    users.remove(conn);
}

server.on('error', function (e) {console.err(e)});

server.listen(config.listen.port, config.listen.host, function () {
    console.log("Listening on " + config.listen.host + " " + config.listen.port)});
