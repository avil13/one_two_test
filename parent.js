var cnt, i, prog, run, spawn, _i;

spawn = require('child_process').spawn;

prog = {};

run = function(prog, n) {
    prog[n] = spawn('node', ['index.js']);
    prog[n].stdout.on('data', function(data) {
        return console.log("stdout: " + data);
    });
    prog[n].stderr.on('data', function(data) {
        return console.log("stderr: " + data);
    });
    prog[n].on('close', function(code) {
        return console.log("child process exited with code " + code);
    });
};

cnt = 2;

if (process.argv[2] != null) {
    cnt = +process.argv[2];
}

for (i = _i = 0; 0 <= cnt ? _i <= cnt : _i >= cnt; i = 0 <= cnt ? ++_i : --_i) {
    run(prog, i);
}
