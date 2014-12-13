var Generator, Reader, action, arg, clc, client, cnt, redis, settings, uuid;

settings = require('./setting');

clc = require('cli-color');

redis = require('redis');

client = redis.createClient();

uuid = (function() {
    var s4;
    s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return (function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    })();
})();

cnt = 0;


/**
Generator
 */

Generator = (function() {
    function Generator() {}

    Generator.getMessage = function() {
        cnt = cnt || 0;
        return cnt++;
    };

    Generator.create = function() {
        var msg_cnt;
        msg_cnt = client.get('msg:id_cnt', function(err, data) {
            var id_cnt, multi;
            if (err != null) {
                throw err;
            }
            id_cnt = +data;
            multi = client.multi([
                ['incr', 'msg:id_cnt'],
                ['rpush', 'msg:processed', ++id_cnt],
                ['hset', 'msg:hlist', id_cnt, Generator.getMessage()]
            ]).exec(function(err, replies) {
                if (err != null) {
                    throw err;
                }
                return console.log("> " + replies);
            });
        });
    };

    return Generator;

})();


/**
Reader
 */

Reader = (function() {
    function Reader() {}

    Reader.eventHandler = function(msg, callback) {
        var onComplete;
        console.log("catch_val " + msg);
        onComplete = function() {
            var error;
            error = Math.random() > 0.85;
            callback(error, msg);
        };
        setTimeout(onComplete, Math.floor(Math.random() * 1000));
    };

    Reader.error_getter = function(err, msg) {
        if (err) {
            client.rpush('error:list', msg);
        }
    };

    Reader.read = function() {
        return client.lpop('msg:processed', function(err, data) {
            if (err != null) {
                throw err;
            }
            return client.hget('msg:hlist', +data, function(err, data) {
                if (err != null) {
                    throw err;
                }
                return Reader.eventHandler(data, Reader.error_getter);
            });
        });
    };

    return Reader;

})();

action = function() {
    client.get('generator:id', function(err, data) {
        if (err != null) {
            throw err;
        }
        if ((data == null) || data === uuid) {
            client.set('generator:id', uuid);
            client.expire('generator:id', settings.timeout_generator_s);
            console.log("I'am generator " + uuid);
            Generator.create();
        } else {
            Reader.read();
        }
    });
};


/*
 * в зависимости от переданных параметров смотрим как надо работать
 * если переданно с параметром getErrors то оборажаем все ошибки и удалем их
 * если этого параметра не было, то работаем в обычном режиме
 */

arg = process.argv.slice(2);

if (arg.indexOf('getErrors' > -1)) {
    console.log(clc.bgRedBright('Show errors:'));
    client.lrange('error:list', 0, -1, function(err, res) {
        var i, _i, _len;
        if (err != null) {
            throw err;
        }
        for (_i = 0, _len = res.length; _i < _len; _i++) {
            i = res[_i];
            console.log(i);
        }
        return client.del('error:list', function(err, res) {
            if (err != null) {
                throw err;
            }
        });
    });
    process.exit();
} else {
    setInterval(action, 500);
}


/*
===
таблицы:
    таблица с сообщениями - msg:hlist  ( hash ) id msg
    таблица со списком созданных id - msg:id_cnt (key)
    таблица со списком не обработанных сообщений - msg:processed ( list ) id id id ...
    таблица с ошибками  - error:list ( list )
    таблица с id генератора и временем последней обработки продолжительность жизни 1с  -  generator:id ( key )
 */
