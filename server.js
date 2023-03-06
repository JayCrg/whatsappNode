const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { writeFile, unlink, existsSync } = require("fs");
const path = require("path");

var usersRoom1 = [];
var usersRoom2 = [];
var usersRoom3 = [];
var usersRoom4 = [];


var connectedUsersRoom1 = 0;
var connectedUsersRoom2 = 0;
var connectedUsersRoom3 = 0;
var connectedUsersRoom4 = 0;



app.use(express.static('public'));

io.on('connection', (socket) => {

  // Sacamos el directorio anterior para poder acceder a la carpeta public
  socket.publicFolder = __dirname + '/public';
  socket.pathToUpload = __dirname + '/public/profile';
  socket.privateMessageUserID = '';
  // Setear ID del usuario
  socket.on('setID', (id) => {
    socket.userID = id;
  });
  // Añadir usuario a la lista de usuarios
  socket.on('addUserToRoom', (data) => {
      socket.username = data.username;
      socket.room = data.room;
      socket.state = data.state;
      socket.userPhoto = data.userPhoto;
      // Guardar foto de usuario en el servidor
      writeFile(`${socket.pathToUpload}/${socket.userID}.jpg`, socket.userPhoto, (err) => {
        if(err) console.log(err);
        socket.emit('subirFoto');
      });
      socket.join(data.room);
      var userData = {
        id: socket.userID,
        username: data.username,
        state: data.state,
      };
      if (data.room === '1') {
        connectedUsersRoom1++;
        usersRoom1.push(userData);
        io.to(socket.room).emit('nuevoUser', usersRoom1);
        io.to(socket.room).emit('conectados', connectedUsersRoom1);
        } else if (data.room === '2') {
        connectedUsersRoom2++;
        usersRoom2.push(userData);
        io.to(socket.room).emit('nuevoUser', usersRoom2);
        io.to(socket.room).emit('conectados', connectedUsersRoom2);
        } else if (data.room === '3') {
        connectedUsersRoom3++;
        usersRoom3.push(userData);
        io.to(socket.room).emit('nuevoUser', usersRoom3);
        io.to(socket.room).emit('conectados', connectedUsersRoom3);
        } else if (data.room === '4') {
        connectedUsersRoom4++;
        usersRoom4.push(userData);
        io.to(socket.room).emit('nuevoUser', usersRoom4);
        io.to(socket.room).emit('conectados', connectedUsersRoom4);
        }
    });
  // Enviar mensaje
  socket.on("newMessage", (msg) => {
      let messageData = {
          message: msg,
          username: socket.username,
          id: socket.userID,
          date: new Date()
      }
      io.to(socket.room).emit('newMessage', messageData);
  });  
  socket.on('typing', (data) => {
    io.to(socket.room).emit('typing', {userID: data.userID, typing: data.typing});
  });
  // Para borrar al usuario de la lista de usuarios
  socket.on('getPhotoOfUser', (data) => {
    socket.emit('getphotoOfUser', {
      path: `profile/${data.userID}.jpg`,
      userID: data.userID,
      username: data.username
    });
  });
  // Enviar foto de usuario
  socket.on('singleUserPhoto', (data) => {
    socket.emit('singleUserPhoto', {
      path: `profile/${data.userID}.jpg`,
      username: data.username,
      state: data.state
    });
  }); 
  // Desconectar usuario
  socket.on('disconnect', () => {
    if (socket.room === '1') {
      connectedUsersRoom1--;
      io.to(socket.room).emit('userDisconnected', {id: socket.userID, username: socket.username, conectados: connectedUsersRoom1});
      usersRoom1 = usersRoom1.filter(user => user.id !== socket.userID);
      } else if (socket.room === '2') {
      connectedUsersRoom2--;
      io.to(socket.room).emit('userDisconnected', {id: socket.userID, username: socket.username, conectados: connectedUsersRoom2});
      usersRoom2 = usersRoom2.filter(user => user.id !== socket.userID);
      } else if (socket.room === '3') {
      connectedUsersRoom3--;
      io.to(socket.room).emit('userDisconnected', {id: socket.userID, username: socket.username, conectados: connectedUsersRoom3});
      usersRoom3 = usersRoom3.filter(user => user.id !== socket.userID);
      } else if (socket.room === '4') {
      connectedUsersRoom4--;
      io.to(socket.room).emit('userDisconnected', {id: socket.userID, username: socket.username, conectados: connectedUsersRoom4});
      usersRoom4 = usersRoom4.filter(user => user.id !== socket.userID);
      }

    if(existsSync(`${socket.pathToUpload}/${socket.userID}.jpg`) == true){
      unlink(`${socket.pathToUpload}/${socket.userID}.jpg`, (err) => {
        if(err){
          console.log(err);
        }
      }
      );
    }

  });
});

server.listen(port, () => {
    console.log(`Whatsapp clone listening on port --> ${port}`)
  })