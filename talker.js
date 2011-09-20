/* This is the main server program */

var util = require('lib/util.js');
var UsersModule = require('lib/Users.js');
var net = require('net');

/* Users handles the collection of all users */
global.users = new UsersModule.Users();

var conf = require("./config.js");
global.config = conf.config;

User.prototype.addMode = function (mode) {
    this.modes.push(mode);
    mode.load(this);
};
User.prototype.print = function (msg) {
    this.conn.write(msg);
};
User.prototype.err = function (msg) {
    this.println("> " + msg);
};
User.prototype.println = function (msg) {
    this.conn.write(msg + "\n");
};
function User(conn) {
    this.conn = conn;
    this.modes = [modes.base];
    this.modes = this.modes.concat(config.defaultModes);
}

/* Modes are what handle user input and dictate the behaviour of the
 * talker. They are intended to mostly be modes in the user interface
 * design sense. For example, you may have a normal talking mode and a
 * separate game or news reading mode where the commands are
 * different. Users have a mode stack. The top mode processes input
 * first. It can then hand off to the next mode down the stack if it
 * does not recognise the command.
 *
 * The load function is called when a mode is added to a users stack.
 * parse is the main function to handle the input. Modes also have a
 * name and help on their commands. See the base mode for an example.
 * 
 * The base mode is installed for every user on creation and could be
 * used to add global commands, although it is probably best to keep
 * it small. It handles the loading of new modes when the mode name is
 * used as a command.
 *
 * Return codes:
 * 1: Command handled, finish handling input.
 * 0: Defer to next mode.
 * -1: Finished, remove mode from stack.
 */

/* Here are defined some builtin modes. Others may be loaded from
 * files stored in the modes directory. This is achieved in the config
 * file. */
var modes = {
    base: {
        name: "Base",

        help: {
            who:          "Show online users",
            time:         "Show the current talker time",
            logout:       "Disconnect",
            "help, h, ?": "This command"
        },

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
            case "who":
                user.println("Online Users");
                user.print(util.thinLine());
                user.println(users.all().map(function (u) {return u.name}).join(" "));
                return 1;
            case "logout":
                user.println(config.messages.logout);
                user.conn.end();
                return 1;
            }

            // Help
            if (input === "help" || input === "?" || input === "h") {
                var help = "";
                for (i = user.modes.length - 1; i >= 0; --i) {
                    help += "\n" + user.modes[i].name + " Commands\n";
                    help += util.thinLine();
                    for (cmd in user.modes[i].help) {
                        help += cmd + ": " + user.modes[i].help[cmd] + "\n";
                    }
                }
                user.println(help);
                return 1;
            }

            user.println("? (h for help)");
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

modes.talk = require('modes/talk.js');

/* This is the main dispatcher for user input.
* 
* It sends the input to the user's current modes for handling. If a
* mode returns 1, this indictates that the input has been fully dealt
* with: the operation ends. Return of 0 means the mode could not
* handle the input and would like to pass it on to the next mode down
* the list. -1 means the mode is exited: it will be removed from the
* user's current mode list. */
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

    console.err("No mode would handle the user input");
}

function removeClient() {
    var conn = this;    var user = users.forConn(conn);
    console.log("Disconnected: " + util.logID(user));
    users.remove(conn);
}

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
});

server.on('error', function (e) {console.err(e)});

server.listen(config.listen.port, config.listen.host, function () {
    console.log("Listening on " + config.listen.host + " " + config.listen.port)});
