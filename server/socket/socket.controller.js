/* 
* @author Lloyd Williams
* Noughts and Crosses with multiplayer support using Angularjs and Nodejs
*/
'use strict';

module.exports = (_io, db) => {

  const io          = _io,
        {promisify} = require('util'),
        redisDB     = db,
        getAsync    = promisify(redisDB.get).bind(redisDB),
        setAsync    = promisify(redisDB.set).bind(redisDB);
  
  const winCombination = [
    [1,2,3], [4,5,6], [7,8,9],
    [1,4,7], [2,5,8], [3,6,9],
    [1,5,9], [3,5,7]
  ];

  /* Binary winning state examples
    111 000 000
    000 111 000
    000 000 111
    
    100 010 001
    100 010 001
    100 010 001
    
    100 001
    010 010
    001 100*/

  let resetGames = () => {
    redisDB.set('totalPlayers',0);
    redisDB.set('totalRooms',0);
    redisDB.set('allRooms', JSON.stringify({
      emptyRooms: [],
      fullRooms : []
    }));
  }

  resetGames();

  /* Figure out if values external from connection are necessary
  let totalRooms    = null,
      availRooms    = null,
      totalPlayers  = null; */
  let assignedRooms = {};


  io.on('connection', (socket) => {
    console.log(socket.id + ' connected!');
    redisDB.incr('totalPlayers');



    socket.on('create-room', () => {
      // install util.promisify-all and apply to redis client
      Promise.all(['totalRooms','allRooms'].map((key) => getAsync(key)))
        .then((arr) => {
          let totalRooms = parseInt(arr[0]),
              rooms      = JSON.parse(arr[1]);
          if (totalRooms <= 100) {
            let id = 1;
            while (id <= 100) {
              let existsEmpty = rooms.emptyRooms.includes(id);
              let existsFull  = rooms.fullRooms.includes(id);
              if (!existsEmpty && !existsFull) {
                break
              }
              id++;
            }
            totalRooms++
            rooms.emptyRooms.push(id);
            redisDB.incr('totalRooms');
            redisDB.set('allRooms', JSON.stringify(rooms));
            console.log(socket.id+ ' joining room-'+id+' as X');
            socket.join('room-'+id);
            socket.emit('joined-room',{
              room: id,
              symbol: ['X','0']
            });
            assignedRooms[socket.id] = id;
          } else {
            socket.emit('alert',{ alert: 'The maximum number of existing rooms has been reached'});
          }
        });
    });

    socket.on('join-room', (id) => {
      getAsync('allRooms')
        .then((str)=> {
          let rooms = JSON.parse(str);
          if (rooms.fullRooms.includes(id)) {
            socket.emit('alert',{ alert: 'The room specified is already full'});
          } else if (rooms.emptyRooms.includes(id)) {
            rooms.emptyRooms.splice(rooms.emptyRooms.indexOf(id), 1);
            rooms.fullRooms.push(id);
            redisDB.set('allRooms', JSON.stringify(rooms));
            console.log(socket.id+ ' joining room-'+id+' as 0');
            socket.join('room-'+id);
            socket.emit('joined-room',{
              room: id,
              symbol: ['0','X']
            });
            assignedRooms[socket.id] = id;
          } else {

            socket.emit('alert',{ alert: `The room specified doesn't exist`});
          }
        });
    });

    socket.on('leave-room', () => {
      let roomId = 'room-'+assignedRooms[socket.id];
      let id     = assignedRooms[socket.id];
      delete assignedRooms[socket.id];
      socket.leave(roomId);
      getAsync('allRooms')
        .then((str) => {
          let rooms = JSON.parse(str);
          rooms.fullRooms.splice(rooms.fullRooms.indexOf(id), 1);
          redisDB.set('allRooms', JSON.stringify(rooms));
        });
    });

    socket.on('disconnect', () => {
      console.log(socket.id + ' disconnected!');
      if (assignedRooms[socket.id]) {
        let roomId = 'room-'+assignedRooms[socket.id];
        delete assignedRooms[socket.id];
        io.to(roomId).emit('opponent-disconnected',{ alert: `Your opponent has disconnected`});
      }
      redisDB.decr('totalPlayers');
    });
  });


  return io;

}