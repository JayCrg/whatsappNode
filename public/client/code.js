var photo;
var socket = io();

function uploadUserPhoto(files) {
  photo = files[0];
}



// Setear ID del usuario
socket.on("connect", function () {
  socket.emit("setID", socket.id);
});

// Sumano usuario a la lista de usuarios en el chat
socket.on("conectados", function (users) {
  socket.on("subirFoto", function () {
    $("#usersConnected").html(`Users connected: ${users}`);
  });
});

// Cuando guardamos la foto cambiamos el texto
$(document).on("change", "#imageInput", function (e) {
  uploadUserPhoto(e.target.files);
  $("#userPhotoLabel").html(`Completado <i class="fa-solid fa-check" class="w-50"></i>`);
});

// Se registra un nuevo usuario
$(document).on("submit", "#joinChat", function (e) {
  e.preventDefault();
  let username = $("#usernameInput").val();
  let state = "Online"
  let room = $("#chatSelect").val();

  if($("#imageInput").val() != ""){
    socket.emit("addUserToRoom", {
      username: username,
      state: state,
      room: room,
      userPhoto: photo,
    });

    $("#usernameInput").val();
    $("body").addClass("container-fluid");
    $("body").html(`
            <div class="row">
                <aside class="col-3 p-0 m-0">
                    <header class="d-flex justify-content-between align-items-center sidebar-header">
                        <div id="sidebar_header" class="d-flex align-items-center justify-content-center gap-3">       
                        </div>
                        <div class="d-flex align-items-center justify-content-center gap-3">
                        </div>
                    </header>
                    <div class="d-flex flex-column justify-content-start align-items-center chat-group gap-3">
                        <p id="usersConnected" class="text-center mt-3"></p>
                        <div id="user-list" class="align-self-start ps-5"></div>
                    </div>
                </aside>
                
                <main class="col-9 d-flex flex-column justify-content-start align-items-center p-0 m-0">
                    <header class="chat-header d-flex justify-content-between align-items-center w-100">
                        <div class="d-flex justify-content-center align-items-center gap-3">
                            <h3 class="mb-3 mt-3 room-number chat-header-title">Sala ${room}</h3>
                        </div>
                    </header>
                    <div id="chat-messages" class="chat-messages w-100 d-flex flex-column justify-content-start">
                    </div>
                    <div class="chat-type d-flex justify-content-evenly align-items-center w-100 gap-3 ps-3 pe-3 pt-3 pb-3">
                        <input id="newMessage" type="text" class="form-control" placeholder="Escribe un mensaje">
                    </div>
                </main>
            </div>`);
  } else {
    $('#photo-error').css('display', 'block');
  }
});
//   });


// Nuevo user conectado
socket.on("nuevoUser", function (users) {

  $("#user-list").html("");

  let lastUser = users[users.length - 1];
  let actualUser;

  if (users.length == 1) {
    actualUser = users[users.length - 1];
  } else {
    users.forEach((user) => {
        if (user.id == socket.id) {
            actualUser = user;
        }
    });
  }

  if (lastUser.id == socket.id) {
    $("#chat-messages").append(`
                <p class="chat-notification text-center mt-4 mb-4 me-4 p-2 w-25 align-self-center">Te has unido al chat</p>
            `);
  } else {
    $("#chat-messages").append(`
                <p class="chat-notification text-center mt-4 mb-4 me-4 p-2 w-25 align-self-center">${lastUser.username} se ha unido</p>
            `);
  }

  socket.emit("singleUserPhoto", {
    userID: actualUser.id,
    username: actualUser.username,
    state: actualUser.state,
  });

  socket.on("singleUserPhoto", function (data) {
    $("#sidebar_header").html(`
                <img src=${data.path} alt="User Photo" class="d-inline-block align-text-top avatar">
                <h3 class="mb-0 usernameInHeader">${data.username} -</h3> <h3 class="mb-0 p-0 stateInHeader">${data.state}</h3>
            `);
  });

  $("#usersConnected").html(`Users connected: ${users.length}`);

  users.forEach(function (user) {
    socket.emit("getPhotoOfUser", {
      userID: user.id,
      username: user.username,
    });
  });
});

// Cuando se desconecta un usuario lo ponemos en la lista de usuario
socket.on("getphotoOfUser", function (data) {
  $("#user-list").append(`
        <div class="card chat-preview w-100 mb-4">
              <div class="row g-0 w-100">
                <div class="col-md-2 d-flex justify-content-center align-items-center">
                  <img src="${data.path}" id="${data.userID}-img" alt="User Photo" class="d-inline-block align-text-top avatar me-5">
                </div>
                <div class="col-md-10 d-flex justify-content-center align-items-center">
                  <div class="card-body p-0 ps-3">
                    <input type="hidden" value="${data.userID}">
                    <h5 class="card-title list-username mb-0">${data.username}</h5>
                    <p class="card-text typing mt-2">Typing...</p>
                  </div>
                </div>
              </div>
          </div>
        `);
});

// Cuando se desconecta un usuario
socket.on("userDisconnected", function (userData) {
  let userID = userData.id;
  let username = userData.username;
  $(`input[value="${userID}"]`).parent().parent().parent().parent().remove();
  $("#chat-messages").append(`
              <p class="chat-notification text-center mt-4 mb-4 me-4 p-2 w-25 align-self-center">${username} has left the chat</p>
          `);
  $("#usersConnected").html(`Users connected: ${userData.conectados}`);
  $("#chat-messages").animate(
    { scrollTop: $("#chat-messages").prop("scrollHeight") },
    500
  );
});

// Reconocemos el enter y enviamos la información
$(document).on("keyup", "#newMessage", function (e) {
  if (e.keyCode === 13) {
    if($("#newMessage").val() != ""){
      socket.emit("newMessage", $("#newMessage").val());
      $("#newMessage").val("");
    }
  }
});

// Formateamos el mensaje
socket.on("newMessage", function (messageData) {
  let formattedDate = new Date(messageData.date);
  let hours = formattedDate.getHours();
  let minutes = formattedDate.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (messageData.id === socket.id) {
    $("#chat-messages").append(`
              <div class="single-message-my-user mt-4 mb-4 me-4 p-3 align-self-end d-flex flex-column">
                  <p class="single-message-content m-0">${messageData.message}</p>
                  <p class="single-message-date mb-0 align-self-end">${hours}:${minutes}</p>
              </div>
              `);
  } else {
    $("#chat-messages").append(`
              <div class="single-message-other-user mt-4 mb-4 ms-4 p-3 align-self-start d-flex flex-column gap-2">
                  <h6 class="single-message-username mb-0">${messageData.username}</h6>
                  <p class="single-message-content m-0">${messageData.message}</p>
                  <p class="single-message-date mb-0 align-self-end">${hours}:${minutes}</p>
              </div>
              `);
  }

  $(".single-message-username").css("color", "#ee50af");
  $("#chat-messages").animate(
    { scrollTop: $("#chat-messages").prop("scrollHeight") },
    500
  );
});

//Reconocemos que el usuario está escribiendo
$(document).on("keyup", "#newMessage", function () {
  if ($("#newMessage").val() !== "") {
    socket.emit("typing", { userID: socket.id, typing: true });
  } else {
    $(".fa-paper-plane")
    socket.emit("typing", { userID: socket.id, typing: false });
  }
});

// Mostramos el typing
socket.on("typing", function (data) {
  if (!data.typing) {
    setInterval(function () {
      $(`input[value="${data.userID}"]`)
        .siblings(".typing")
        .css("display", "none");
    }, 3000);
  } else {
    $(`input[value="${data.userID}"]`)
      .siblings(".typing")
      .css("display", "block");
  }
});

