/*
Anthony Roberts
*/

var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var url = require('url');
const ROOT = "./files";

http.listen(process.env.PORT || 5000);

console.log("Chat server listening on port 5000");


function handler(req,res){

	var urlObj = url.parse(req.url,true);
	var filename = ROOT+urlObj.pathname;
	var data = "";
	
	
	if(fs.existsSync(filename)){
	
		var stats = fs.statSync(filename);
		if(stats.isDirectory()){
			filename += "/index.html";
		}
		console.log("Getting file: "+filename);
		data = fs.readFileSync(filename);
		code = 200;
		
	}
	else{
		console.log("File not found");
		code = 404;
		data = getFileContents(ROOT+"/404.html");
	} 

	res.end(data);
};

var clients = [];

io.on("connection", function(socket){
	console.log("Got a connection");

	socket.on("intro",function(data){
		socket.username = data;
		socket.blockedList = [];
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+".");
		clients.push(socket);
		io.sockets.emit("userList", getUserList());
	});
		
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);
		
	});
	
	socket.on("privateMessage", function(data){
		console.log("got privateMessage Request: "+data.message);
		console.log("for: "+data.username);
		
		var sendData = {
			username: "",
			message: ""
		};
		
		for(var i = 0; i < clients.length; i++){ //loop to find target user in clients list
			if(clients[i].username == data.username){// found target user
				if(clients[i].blockedList.indexOf(socket.username) == -1){ //the target user does not have our sending user blocked
					console.log("sending to: " + clients[i].username);
					sendData.username = socket.username; //send current socket username so target user can reply
					sendData.message = data.message;
					clients[i].emit("privateMessage",sendData); //emit pmessage to target user
				}
				else{ // taget user DOES have our sending user blocked
					socket.emit("message","That user has blocked you.");
				}
			}
		}
		
	});
	
	socket.on("blockUser", function(data){
		console.log("got blockUser Request: "+data.username);
		var unblock = 0; //flag to decide whether to unblock a user or not
			console.log(socket.blockedList.length);
		for(var i = 0; i < socket.blockedList.length; i++){ //search through the users blocked list
			console.log("unblocking: comparing " + socket.blockedList[i] + " with " + data.username);
			if(socket.blockedList[i] == data.username){//if the requested blocked username is already in the list
				var unblock = 1; //request is to unblock the user, so flag to 1
				socket.blockedList.splice(i,1); //remove the user from the blocked list
				socket.emit("message","Unblocked: "+data.username+".");
				console.log("removed user from blocked list");
			}
		}
		if(unblock == 0){ // if the user is to be blocked/added to blockedList
			socket.blockedList.push(data.username);
			socket.emit("message","Blocked: "+data.username+".");
			console.log("added user to blocked list");
		}
		
	});

	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
		clients = clients.filter(function(ele){  
			   return ele!==socket;
		});
		io.sockets.emit("userList", getUserList());
	});
	
});

function timestamp(){
	return new Date().toLocaleTimeString();
}

function getUserList(){
    var ret = [];
    for(var i=0;i<clients.length;i++){
        ret.push(clients[i].username);
		
    }
    return ret;
}
 
function getFileContents(filename){ //for the 404
	var contents="";
	
	var stats = fs.statSync(filename);
	if(stats.isDirectory()){
		contents = fs.readdirSync(filename).join("\n");
	}else{
	
		contents = fs.readFileSync(filename);
	}	
	
	return contents;
}