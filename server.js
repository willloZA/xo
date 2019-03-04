/* 
* @author Lloyd Williams
* Noughts and Crosses with multiplayer support using Angularjs and Nodejs
*/
'use strict';

const express     = require('express'),
      http        = require('http'),
      bodyParser  = require('body-parser'),
      cors        = require('cors'),
      socketio    = require('socket.io');

// remember to install redis-server and run
const redisDB     = require('./server/db/redis.connect').connect();

// test data
// redisDB.set('foo','bar');

const redisRoute  = require('./server/routes/redis.route');

class Server{
  constructor() {
    this.port   = process.env.PORT || 8000;
    this.host   = 'localhost';

    this.app    = express();
    this.http   = http.Server(this.app);
    this.io     = socketio(this.http);
  }

  appConfig() {
    //bodyParser and cors setup
    this.app.use(bodyParser.json());
    this.app.use(cors());

    this.app.use(express.static(__dirname + "/app"));
    //redis route requires redisDB client as param
    this.app.use(redisRoute(redisDB));
  }

  appStart() {
    this.appConfig();

    require('./server/socket/socket.controller')(this.io, redisDB);

    this.http.listen(this.port, this.host, () => {
      console.log(`Listening on http://${this.host}:${this.port}`);
    });
  }
}

const app = new Server();
app.appStart();