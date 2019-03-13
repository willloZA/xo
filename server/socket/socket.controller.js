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
        setAsync    = promisify(redisDB.set).bind(redisDB),
        delAsync    = promisify(redisDB.del).bind(redisDB),
        saddAsync   = promisify(redisDB.sadd).bind(redisDB),
        sremAsync   = promisify(redisDB.srem).bind(redisDB),
        sIsMemAsync = promisify(redisDB.sismember).bind(redisDB);
  
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
    // console.log('state: ' + state.toString(2) + ' or ' + state);
    for (let idx = 0; idx < winCombination.length; idx++) {
      if ((state & winCombination[idx]) === winCombination[idx]) {
        /* console.log((state & winCombination[idx]).toString(2) + ' or ' + (state & winCombination[idx]));
        console.log(winCombination[idx].toString(2) + ' or ' + winCombination[idx]);
        console.log((state & winCombination[idx])===winCombination[idx]); */
        return 'win'
      }
    }
    return state;
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
  let mpAssignedRooms = {},
      mpRoomStoreTemp = {
                          players: [],
                          boardState: 0
                        };


  io.on('connection', (socket) => {
    console.log(socket.id + ' connected!');
    redisDB.incr('totalPlayers');

    Promise.all(['totalPlayers','allRooms'].map((key) => getAsync(key)))
      .then((data) => {
      if (data) {
        data[1] = JSON.parse(data[1]).emptyRooms;
        io.emit('player-count', data[0]);
        io.emit('available-rooms', data[1]);
      }
    });

    socket.on('mp-move', (data) => {
      console.log(data);
      if (data.room && mpAssignedRooms[socket.id] && data.room === mpAssignedRooms[socket.id]) {
        getAsync('room-'+data.room)
          .then((str) => {
            let roomStore = JSON.parse(str);
            if (roomStore.players.indexOf(socket.id) === 0) {
              roomStore[socket.id] |= data.move;
              roomStore.boardState |= data.move;
              let result = validate(roomStore[socket.id]);
              result = (result != 'win') ? ((roomStore.boardState === 511) ? 'draw' : 'cont') : 'mp-'+result;
              roomStore.players.reverse();
              setAsync('room-'+data.room, JSON.stringify(roomStore))
                .then((resp) => {
                  if (resp) {
                    //if winning move update room boards and announce winner
                    if (result === 'mp-win') {
                      console.log(socket.id + ' wins');
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
            setAsync('allRooms', JSON.stringify(rooms))
              .then((resp) => {
                if (resp) {
                  //create room data entry in redis (binary boardState, binary socketId moves, players array of socketIds)
                  let roomStore = JSON.parse(JSON.stringify(mpRoomStoreTemp));
                  roomStore.players.push(socket.id);
                  roomStore[socket.id] = 0;
                  setAsync('room-'+id, JSON.stringify(roomStore))
                  .then((resp) => {
                    if (resp) {
                      console.log(socket.id+ ' joining room-'+id+' as X');
                      socket.join('room-'+id);
                      socket.emit('joined-room',{
                        room: id,
                        symbol: ['X','0']
                      });
                      mpAssignedRooms[socket.id] = id;
                      io.emit('available-rooms', rooms.emptyRooms);
                    } else {
                      //error
                      console.alert('failed to set room-'+id)+' store';
                    }

                  });
                } else {
                  //error
                  console.alert('failed to set allRooms');
                }
              });            
          } else {
            console.log('maxed rooms');
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
            io.emit('available-rooms', rooms.emptyRooms);
            console.log(socket.id+ ' joining room-'+id+' as 0');
            socket.join('room-'+id);
            socket.emit('joined-room',{
              room: id,
              symbol: ['0','X']
            });
            mpAssignedRooms[socket.id] = id;
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

    socket.on('restart', () => {
      if (mpAssignedRooms[socket.id]) {
        let id = mpAssignedRooms[socket.id],
            roomId = 'room-'+id;
        console.log(socket.id + ' restarting ' + roomId);
        socket.to(roomId).emit('close-modal');
        getAsync('room-'+id)
          .then((str) => {
            let roomStore = JSON.parse(str);
            let players = roomStore.players;
            roomStore.boardState = 0;
            roomStore[players[0]] = 0;
            roomStore[players[1]] = 0;
            if (players[0] !== socket.id) {
              roomStore.players.reverse();
            }
            setAsync('room-'+id, JSON.stringify(roomStore))
              .then((resp) => {
                if (resp) {
                  io.to(roomId).emit('game-start');
                }
              });
          });
      }
    });

    socket.on('leave-room', () => {
      let id     = mpAssignedRooms[socket.id],
          roomId = 'room-'+id;
      delete mpAssignedRooms[socket.id];
      console.log(socket.id + ' leaving ' + roomId);
      socket.leave(roomId);
      getAsync('allRooms')
        .then((str) => {
          let rooms = JSON.parse(str);
          if (rooms.fullRooms.indexOf(id) > -1) {
            getAsync(roomId)
              .then((roomStr) => {
                if (roomStr) {
                  let room = JSON.parse(roomStr);
                  console.log(room);
                  delete room[socket.id];
                  setAsync(roomId, JSON.stringify(room))
                    .then((resp) => {
                      if (resp) {
                        rooms.emptyRooms.push(rooms.fullRooms.splice(rooms.fullRooms.indexOf(id), 1));
                      }
                    });
                }
              });
          } else if (rooms.emptyRooms.indexOf(id) > -1) {
            rooms.emptyRooms.splice(rooms.fullRooms.indexOf(id), 1);
            redisDB.del(roomId);
          }
          redisDB.set('allRooms', JSON.stringify(rooms));
        });
    });

    socket.on('disconnect', () => {
      console.log(socket.id + ' disconnected at ' + Date.now());
      if (mpAssignedRooms[socket.id]) {
        let id     = mpAssignedRooms[socket.id];
        let roomId = 'room-'+id;
        delete mpAssignedRooms[socket.id];

        getAsync('allRooms')
        .then((str) => {
          let rooms = JSON.parse(str);
          if (rooms.fullRooms.indexOf(id) > -1) {
            rooms.emptyRooms.push(rooms.fullRooms.splice(rooms.fullRooms.indexOf(id), 1)[0]);
          } else if (rooms.emptyRooms.indexOf(id) > -1) {
            rooms.emptyRooms.splice(rooms.fullRooms.indexOf(id), 1);
            delAsync(roomId);
          }
          setAsync('allRooms', JSON.stringify(rooms))
            .then((resp) => {
              io.to(roomId).emit('opponent-disconnected',{ alert: `Your opponent has disconnected`});
              io.emit('available-rooms', rooms.emptyRooms);
            });
        });
        //remove sockedId from room store or if the last socketId in players array remove room store entirely and update all rooms
      }

      
      redisDB.decr('totalPlayers');

      getAsync('totalPlayers')
        .then((data) => {
        if (data) {
          io.emit('player-count', data);
        }
        });
    });
  });


  return io;

}