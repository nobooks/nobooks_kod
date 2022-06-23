const { MongoClient } = require('mongodb');
const mongoose = require("mongoose")
//const bodyParser = require("body-parser");
const uri = "mongodb+srv://seymaatmaca:34mongodb@nobooks.ya4ud.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const dbName = 'NoBooks';
const userSchema = new mongoose.Schema({
    username: String,
    pass: String,
    room_name: String,
    room_pass: String
})
const users_val = mongoose.model('users', userSchema)



var express = require('express');
const { callbackify } = require('util');
var app = express();
var server = require('http').createServer(app);
const io = require('socket.io')(server);
users = [];
connections = [];

server.listen(process.env.PORT || 3000 );
console.log('Server running..')
app.get('/', function(req,res){
    res.sendFile(__dirname + '/signIn.html');
});


//socket kurulması
io.sockets.on('connection', function(socket){
    connections.push(socket);
    console.log('Connected: %s sockets connected ', connections.length);

    //Disconnect
    socket.on('disconnect',function(data){
       
        users.splice(users.indexOf(socket.username),1);
        updateUsernames();
        connections.splice(connections.indexOf(socket),1);
        console.log('Disconnected: %s sockets connected', connections.length);
    
    });

    socket.on('join room', function(username, userpass, roomname,roompass,callback){
        console.log("user: ",username,userpass);
        socket.username = username;
        socket.pass = userpass;
        //socket.roomname = roomname;
        socket.roompass = roompass;
        const existingUser = users.find((user) => {
            user.roomname === roomname && user.username === username
             });

            if(existingUser) {
                  return 0;                    
                }
        users.push(socket.username);
        updateUsernames();
        addRoom(username, userpass, roomname, roompass);

    });

    socket.on('send message', function(data){
        io.sockets.emit('new message', {msg: data, user: socket.username});
        
    });



    function updateUsernames()
    {
        io.sockets.emit('get users',users);
    }
});


async function addRoom(username, userpass, roomname, roompass){
    await client.connect();
    console.log('Connected succesfully to server');

    const db = client.db(dbName);
    const collection = await db.collection('users');

    const insertOne = await collection.insertOne({username: username, pass: userpass, room_name: roomname, room_pass: roompass});
    client.close();
}


