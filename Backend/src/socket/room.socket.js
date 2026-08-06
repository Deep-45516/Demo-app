//Joins user rooms
export function joinUserRoom(socket) {
  socket.join(
    `user:${socket.user._id}`
  );

  console.log(
`${socket.user.instagramUsername}
joined room:
user:${socket.user._id}`
  );
}

    //it creates a unique room,so same user will get join that room even with diffrent devices,becuz it creates a diffrent socket in same room,so we can send message to all devices of same user