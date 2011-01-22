/* Remove trailing whitespace */
function chomp (s) {
    return /^(.*?)\s*$/.exec(s)[1];
}

function thinLine () {
    var out = '';
    for (var i = 80; i > 0; --i) {
        out += '-';
    }
    out += "\n";
    return out;
}

function logID (user) {
    return user.name + '@' + user.conn.remoteAddress + ":" + user.conn.remotePort;
}

function wall(msg) {
    var other;
    var ul = users.all();
    for (other in ul) {
        ul[other].println(msg);
    }
}

exports.chomp = chomp;
exports.logID = logID;
exports.wall = wall;
exports.thinLine = thinLine;