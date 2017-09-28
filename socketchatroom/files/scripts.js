/*
Anthony Roberts
*/


$(document).ready(function(){

	var userName = prompt("What's your name?")||"User";
	
	var socket = io(); //connect to the server that sent this page
	socket.on('connect', function(){
		socket.emit("intro", userName);
	});
	
	$('#inputText').keypress(function(ev){
			if(ev.which===13){
				//send message
				socket.emit("message",$(this).val());
				ev.preventDefault(); //if any
				$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
				$(this).val(""); //empty the input
			}
	});
	
	socket.on("message",function(data){
		$("#chatLog").append(data+"\n");
		$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
	});
	
	socket.on("privateMessage",function(data){
		var pResponseData = {// data object for private message response
					username:"",
					message:""
				};
		var pResponseMessage = prompt(data.username + " said: " + data.message);
		if(pResponseMessage == null || pResponseMessage == ""){// chat is over
			console.log("private conversation ended");
		}
		else{
			pResponseData.username = data.username;
			pResponseData.message = pResponseMessage;
			socket.emit("privateMessage", pResponseData);
		}
	});
	
	socket.on("userList",function(data){
		$("ul").empty();
		var list = document.getElementById('userList');
		
		for(var i = 0; i < data.length; i++){
			var entry = document.createElement('li');
			entry.appendChild(document.createTextNode(data[i] + "\n"));
			entry.addEventListener("dblclick",function(e) {
				if(e.ctrlKey){ //if control was held down at the click, block user
					var bData = {//data object for blocking event
						username: ""
					};
					bData.username = this.innerHTML;
					bData.username = bData.username.replace(/\r?\n|\r/g, "");
					socket.emit("blockUser", bData);
					
				}
				else{
					var pData = {// data object for private message
						username:"",
						message:""
					};
					var pMessage = '';//private message var
					pMessage = prompt("Enter a private message:")||"";
					pData.username = this.innerHTML;
					pData.username = pData.username.replace(/\r?\n|\r/g, "");
					pData.message = pMessage;
					socket.emit("privateMessage", pData);
				}
			});
			list.appendChild(entry);
		}
	});
	
});