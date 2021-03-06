var EventEmitter = require('event-emitter');

function Incus(url, UID, page) {
    this.MAXRETRIES   = 6;
    
    this.socketRetries = 0;
    this.pollRetries   = 0;

    this.url          = url;
    this.UID          = UID;
    this.page         = page;
    
    this.socket          = null;
    this.poll            = null;
    this.pollCommand     = null;
    this.connected       = false;
    this.socketConnected = false;

    this.emitter = new EventEmitter({});
    
    this.connect();
}

Incus.prototype.longpoll = function(command) {
    if(this.socketConnected) { return; }
    
    if(this.poll != null) {
        this.poll.abort();
        this.pollCommand = null;
    }
    
    this.poll = new XMLHttpRequest();
    
    var data = {'user': this.UID};
    if(this.page) {
        data['page'] = this.page;
    }
    
    if(typeof command != 'undefined') {
        data['command'] = command;
        this.pollCommand = command;
    }
    
    var query_string = this.serialize(data);
    
    var self = this;
    this.poll.onreadystatechange = function() {
        if(self.poll.readyState == 4) {
            var response = {
                'data'   : self.poll.responseText,
                'status' : self.poll.status,
                'success': true
            };
            
            if(self.poll.status !== 0 && self.pollRetries < self.MAXRETRIES) {
                self.longpoll();
            }
            
            if(response.status != 200 && response.status != 204 && response.status !== 0) {
                self.pollRetries++;
            }
            
            if(response.status == 200 && response.data !== "") {
                self.onMessage(response);
            }
        }
    }
    
    this.poll.open("GET", this.url+'/lp'+query_string, true);
    this.poll.timeout = 0;
    this.poll.send();
    
    this.connected = true;

    this.emitter.emit('connect');
}

Incus.prototype.connect = function() {
    this.longpoll();
    
    if("WebSocket" in window) {
        this.connectSocket();
    }
}

Incus.prototype.connectSocket = function() {
    var url = this.url.replace("https", "wss").replace("http", "ws");
    this.socket = new WebSocket(url+'/socket');
    
    var self = this;
    this.socket.onopen    = function()  { self.authenticate() };
    this.socket.onmessage = function(e) { self.onMessage(e) };
    this.socket.onclose   = function()  { self.onClose() };
}

Incus.prototype.newCommand = function(command, message) {
    message['time'] = Math.round(new Date().getTime() / 1000);
    var obj = {
        "command": command,
        "message": message
    };
    
    return JSON.stringify(obj);
}

Incus.prototype.authenticate = function() {
    this.socketConnected = true;

    this.poll.abort();
    
    var message = this.newCommand({'command': "authenticate", 'user': this.UID}, {});
    
    this.socket.send(message);
    
    if(this.page) {
        this.setPage(this.page);
    }

    if(this.pollCommand !== null) {
        this.socket.send(this.pollCommand);
        this.pollCommand = null;
    }
    
    this.emitter.emit('connect');
    
    this.connected = true;
}

Incus.prototype.on = function(name, func) {
    this.emitter.on('event:' + name, func);
}

Incus.prototype.onMessage = function(e) {
    if(e.data === "") {
        this.socketRetries = 0;
        return;
    }

    var msg = JSON.parse(e.data);

    if("event" in msg) {
        this.emitter.emit('event:' + msg.event, msg.data);
    }
}

Incus.prototype.onClose = function() {
    if(this.socketRetries > this.MAXRETRIES) {
        return;
    }
    
    this.socketRetries++;
    this.connected = false;
    
    var self = this;
    window.setTimeout(function() {
        console.log("Connection closed, retrying");
        
        self.connectSocket();
    }, 1000);
}

Incus.prototype.MessageUser = function(event, UID, data) {
    var command = {"command": "message", "user": UID};
    var message = {"event": event, "data": data};
    
    var msg = this.newCommand(command, message);
    return this.send(msg);
}

Incus.prototype.MessagePage = function(event, page, data) {
    var command = {"command": "message", "page": page};
    var message = {"event": event, "data": data};
    
    var msg = this.newCommand(command, message);
    return this.send(msg);
}

Incus.prototype.MessageAll = function(event, data) {
    var command = {"command": "message"};
    var message = {"event": event, "data": data};
    
    var msg = this.newCommand(command, message);
    return this.send(msg);
}

Incus.prototype.setPage = function(page) {
    this.page   = page;
    
    if(this.socketConnected) {
        var command = {'command': 'setpage', 'page': page};
    
        var msg = this.newCommand(command, {});
        return this.send(msg);
    }
    
    this.send();
}

Incus.prototype.serialize = function(obj) {
   var str = [];
   
   for(var p in obj){
       if(obj.hasOwnProperty(p)) {
           str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
       }
   }
   return '?'+str.join("&");
}

Incus.prototype.send = function(command) {
    if(this.socketConnected) {
        this.socket.send(command);
    } else {
        this.longpoll(command);
    }
}

module.exports = Incus;
