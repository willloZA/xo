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
    parseInt('111000000',2),
    parseInt('000111000',2),
    parseInt('000000111',2),
    parseInt('100100100',2),
    parseInt('010010010',2),
    parseInt('001001001',2),
    parseInt('100010001',2),
    parseInt('001010100',2)
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
  
  let validate = (state) => {
    for (let idx = 0; idx < winCombination.length; idx++) {
      if (state & winCombination[idx] === winCombination[idx]) return 'win'
      return state;
    }

  }

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
  let assignedRooms = {},
      roomStoreTemp = {
                        players: [],
                        boardState: 0
                      };


  io.on('connection', (socket) => {
    console.log(socket.id + ' connected!');
    redisDB.incr('totalPlayers');

    // requires move gridID, retrieve room data if exists validation of move (win/draw/continue) and store room game data in redis  
    socket.on('sp-move', (data) => {

    });

    socket.on('mp-move', (data) => {
      if (data.room && assignedRooms[socket.id] && data.room === assignedRooms[socket.id]) {
        getAsync('room-'+data.room)
          .then((str) => {
            let roomStore = JSON.parse(str);
            if (roomStore.players.indexOf(socket.id) === 0) {
              roomStore[socket.id] |= data.move;
              roomStore.boardState |= data.move;
              let result = validate(roomStore[socket.id]);
              result = (result != 'win') ? ((result === 511) ? 'draw' : 'cont') : result;
              roomStore.players.reverse();
              //change all redisDB.set to setAsync and encapsulate actions after set in then depending on resp
              setAsync('room-'+data.room, JSON.stringify(roomStore))
                .then((resp) => {
                  if (resp) {
                    //if winning move update room boards and announce winner
                    if (result === 'win') {
                      socket.to('room-'+data.room).emit('lose',data);
                      socket.emit(result);
                    } else {
                      socket.to('room-'+data.room).emit(result,data);
                      socket.emit(result);
                    }
                  } else {
                    console.alert('redis setAsync failed')
                    socket.emit('alert',{ alert: 'issue with server'});
                  }
                });
            }
          });

      } else {
        socket.emit('alert',{ alert: 'incorrect room specified'});
      }

    });

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
            //create room data entry in redis (binary boardState, binary socketId moves, players array of socketIds)
            let roomStore = roomStoreTemp;
            roomStore.players.push(socket.id);
            roomStore[socket.id] = 0;
            redisDB.set('room-'+id, JSON.stringify(roomStore));
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
            //update room data entry in redis before initiating game
            getAsync('room-'+id)
              .then((str) => {
                let roomStore = JSON.parse(str);
                roomStore.players.push(socket.id);
                roomStore[socket.id] = 0;
                redisDB.set('room-'+id, JSON.stringify(roomStore));
                io.to('room-'+id).emit('game-start');
              });
          } else {

            socket.emit('alert',{ alert: `The room specified doesn't exist`});
          }
        });
    });

    socket.on('leave-room', () => {
      let id     = assignedRooms[socket.id],
          roomId = 'room-'+id;
      delete assignedRooms[socket.id];
      socket.leave(roomId);
      getAsync('allRooms')
        .then((str) => {
          let rooms = JSON.parse(str);
          rooms.fullRooms.splice(rooms.fullRooms.indexOf(id), 1);
          redisDB.set('allRooms', JSON.stringify(rooms));
          redisDB.del(roomId);
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