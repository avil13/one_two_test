one_two_test
============

Решение [тестового задания](challenge.md "задание")


> В начале тестового задание странное и не очень понятное описание того какие модули можно использовать,а какие нет.
 Поэтому использовал только REDIS ибо менеджер сказал что можно.


**таблицы:**

| тип  | название  | описание   |
|---|---|---|
| хэш | msg:hlist | таблица с сообщениями  |
| строка | msg:id_cnt  | таблица с количеством созданных сообщений  |
| список |  msg:processed | таблица со списком не обработанных сообщений  |
| список | error:list  |  таблица с ошибками |
| строка  | generator:id  | таблица с id генератора |

___

Будем считать что REDIS сервер уже запущен по умолчанию и это сейчас не на нашей совести, так же как и установка node.js и git.

```
git clone https://github.com/avil13/one_two_test.git
cd one_two_test/
npm install
node index.js
```

в файле ```setting.json``` находятся настройки времени жизни сессии генератора и времени в течении которого создаются и читются сообщения


Что бы посмотреть список всех сообщений которые были прочитаны с ошибкой, а так же очистить лог ошибок нужно запустить скрипт с параметром ```getErrors``` :

```
node index.js getErrors
```

Что бы сгенерировать 1 000 000 записей:

```
node index.js 1M
```

Что бы очистить все записи:

```
node index.js clear
```

---

**Паралельные процессы**

Так же есть скрипт для запуска нескольких паралельно работающих процессов.

```
node parent.js
```

По умолчанию запускает 2 процесса, но можно передать количество процессов для запуска в виде параметра:

```
node parent.js 5 // будет запущено 5 процессов
```

---

> P.S. Скрипты изначально писались на coffee 
в случае если есть что добавить или исправить, буду рад фидбеку.

> a.1.3( at )mail.ru



