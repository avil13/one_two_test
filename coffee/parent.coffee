spawn = require('child_process').spawn

prog = {}

run = (prog, n)->
    prog[n] = spawn 'node', ['index.js']
    prog[n].stdout.on 'data', (data)-> console.log "stdout: #{data}"
    prog[n].stderr.on 'data', (data)-> console.log "stderr: #{data}"
    prog[n].on 'close', (code)-> console.log "child process exited with code #{code}"
    # setTimeout (->prog.kill 'SIGHUP'), 20000
    return


cnt = 2

#
if process.argv[2]?
    cnt = +process.argv[2]


for i in [0..cnt] then run(prog, i)

