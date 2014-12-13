settings = require './setting'

clc = require 'cli-color'

redis = require 'redis'
client = do redis.createClient

uuid = do ->
    s4 = -> Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
    do -> s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

cnt = 0
###*
Generator
###
class Generator
    @getMessage: ->
        cnt = cnt || 0
        cnt++

    @create: =>
        msg_cnt = client.get 'msg:id_cnt', (err, data)=>
            throw err if err?

            id_cnt = +data

            multi = client.multi [
                    ['incr', 'msg:id_cnt'],
                    ['rpush', 'msg:processed',  ++id_cnt],
                    ['hset', 'msg:hlist',  id_cnt, @getMessage()]
                ]
            .exec (err, replies)->
                throw err if err?
                console.log clc.green "#{replies}"
            return
        return


###*
Reader
###
class Reader
    # Приложение, получая сообщение, передаёт его в данную функцию
    @eventHandler: (msg, callback) ->
        onComplete = ->
            error = Math.random() > 0.85
            callback error, msg
            return
        #  processing takes time...
        setTimeout onComplete, Math.floor(Math.random()*1000)
        return

    # метод для обраотки ошибок
    @error_getter: (err, msg)->
        if(err) then client.rpush 'error:list', msg
        return

    # Метод для чтения сообщений
    @read: =>
        client.lpop 'msg:processed', (err, data)=>
            throw err if err?
            client.hget 'msg:hlist', +data, (err, data)=>
                throw err if err?
                @eventHandler data, @error_getter
                console.log "read: #{data}"


action = ->
    # определяем что больше генератора нет и пытаемся сполучить его роль
    client.get 'generator:id', (err, data)->
        throw err if err?

        if !data? || data == uuid
            client.set 'generator:id', uuid
            client.expire 'generator:id', settings.timeout_generator_s
            console.log clc.bgGreen "I'am generator #{uuid}"
            # генератор создает сообщение каждые 500мс
            do Generator.create
        else
            # если не смогли то становимся ридером
            do Reader.read
        return
    return



###
# в зависимости от переданных параметров смотрим как надо работать
# если переданно с параметром getErrors то оборажаем все ошибки и удалем их
# если этого параметра не было, то работаем в обычном режиме
###
arg = process.argv.slice 2

if (arg.indexOf 'getErrors') > -1

    console.log clc.bgRedBright 'Show errors:'

    client.lrange 'error:list', 0, -1, (err, res)->
        throw err if err?
        for i in res
            console.log i
        client.del 'error:list', (err, res)->
            throw err if err?
            console.log clc.bgRedBright "Error list cleared: #{res}"
            do process.exit

else if (arg.indexOf '1M') > -1

    console.log clc.bgGreen 'Create 1 000 000 record:'
    client.flushdb ->
        for i in [1..1000000]
            client.rpush 'msg:processed', i
            client.hset 'msg:hlist',  i, Generator.getMessage()
            if i >= 1000000
                client.set 'msg:id_cnt', i
                console.log clc.bgBlueBright '+1 000 000 record'
                do process.exit

else if (arg.indexOf 'clear') > -1

    client.flushdb ->
        do process.exit

else

    setInterval action, settings.timeout_ms

