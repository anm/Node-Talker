var util = require('util.js');

/* Talk mode.
 * This is the main mode.
 */

/* Message to all users */
function say (user, msg) {
    var out = user.name + ': ' + msg;
    util.wall(out);
}

function load () {}

function parse (user, input) {
    input = util.chomp(input);

    var cmd, args, caps;
    caps = /^(\S+)\s*(.*)/.exec(input);
    if (!caps) {
        return 0;
    }
    cmd = caps[1];
    args = caps[2];
    
    switch (cmd) {
    case "say":
        say(user, args);
        return 1;
    }
    return 0;
}

exports.load = load;
exports.parse = parse;
