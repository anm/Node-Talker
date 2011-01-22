/* Remove trailing whitespace */
function chomp (s) {
    return /^(.*?)\s*$/.exec(s)[1];
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