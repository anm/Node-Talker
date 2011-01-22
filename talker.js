require.paths.push('lib');
require.paths.push('modes');

var util = require('util.js');
var UsersModule = require('Users.js');
var net = require('net');

global.users = new UsersModule.Users();

var config = {
    talker: {name: "Node"},
    listen: {host: undefined, // undefined to listen on all addresses
             port: 5555
            },

    /* Modes that will be loaded for every user on login */
    defaultModes: [],

    /* Modes which may be started by the user. The key is the command
     * to start the mode. */
    userModes: {
        //fortune: require('modes/fortune.js')
    }
};

var server = net.createServer(function (client) {
    // Client is a Stream object

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
User.prototype.err = function (msg) {
    this.print("> " + msg);
};
User.prototype.println = function (msg) {
    this.conn.write(msg + "\n");
};
function User(conn) {
    this.conn = conn;
    this.modes = [modes.base];
    this.modes = this.modes.concat(config.defaultModes);
}

var modes = {
    base: {
        load: function () {},
        parse: function (user, input) {
            input = util.chomp(input);

            // Possibly load a new mode
            for (mode in config.userModes) {
                if (input === mode) {
                    user.addMode(mode);
                    return 1;
                }
            }

            // Builtins
            switch (input) {
            case "time":
                user.println(new Date().toLocaleTimeString());
                return 1;
            }

            user.println("?");
            return 1;
        }
    },

    login: {
        load: function (user) {
            user.print("User Name: ");
        },

        parse: function (user, input) {
            var name = util.chomp(input);
            if (! /^[A-Za-z0-9]+[A-Za-z0-9_]*$/.test(name)) {
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
            console.log(util.logID(user) + ' connected');
            user.addMode(modes.talk);
            user.println("Welcome to " + config.talker.name + ", " + user.name);
            return -1;
        }
    }
};

modes.talk = require('talk.js');

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


function endStream() {
    this.end();
}

function removeClient() {
    var conn = this;
    var user = users.forConn(conn);
    console.log("Disconnected: " + util.logID(user));
    users.remove(conn);
}

server.on('error', function (e) {console.err(e)});

server.listen(config.listen.port, config.listen.host, function () {
    console.log("Listening on " + config.listen.host + " " + config.listen.port)});
