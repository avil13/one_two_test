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
                return console.log(clc.green("" + replies));
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
                Reader.eventHandler(data, Reader.error_getter);
                return console.log("read: " + data);
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
            console.log(clc.bgGreen("I'am generator " + uuid));
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

if ((arg.indexOf('getErrors')) > -1) {
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
            console.log(clc.bgRedBright("Error list cleared: " + res));
            return process.exit();
        });
    });
} else if ((arg.indexOf('1M')) > -1) {
    console.log(clc.bgGreen('Create 1 000 000 record:'));
    client.flushdb(function() {
        var i, _i, _results;
        _results = [];
        for (i = _i = 1; _i <= 1000000; i = ++_i) {
            client.rpush('msg:processed', i);
            client.hset('msg:hlist', i, Generator.getMessage());
            if (i >= 1000000) {
                client.set('msg:id_cnt', i);
                console.log(clc.bgBlueBright('+1 000 000 record'));
                _results.push(process.exit());
            } else {
                _results.push(void 0);
            }
        }
        return _results;
    });
} else if ((arg.indexOf('clear')) > -1) {
    client.flushdb(function() {
        return process.exit();
    });
} else {
    setInterval(action, settings.timeout_ms);
}
