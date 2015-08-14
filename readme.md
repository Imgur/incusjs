# Incus.js [![Build Status](https://travis-ci.org/jacobgreenleaf/incusjs.svg)](https://travis-ci.org/jacobgreenleaf/incusjs) [![NPM](https://img.shields.io/npm/v/incusjs.svg)](https://www.npmjs.com/package/incusjs)

JavaScript bindings for talking to an [Incus](http://github.com/Imgur/incus) server in the browser or on the server-side. 

## Example 1: Reacting to incoming events

```Javascript
var incus = new Incus.Client('http://localhost:4000', 'UID', '/page/path');

incus.on('connect', function() {
    console.log('connected');
}

incus.on('Event1', function (data) {
   console.log(data);
}
```

## Example 2: Updating the page

Incus keeps track of which *page* a user is currently on, for the page message events. A *page* is just an arbitrary string. Use this to, for example, provide real-time updates only to users viewing particular content at a particular URL: 

```Javascript
$(function() {
    incus.setPage(window.location.path);
});
```

## Example 3: User messaging

Incus supports user-generated messages. You could use this to, for example, implement a simple chat system:  

```Html
<div id="chat">
    <div id="messages"></div>
    
    <form id="input">
        <input type="text" class="input" placeholder="Say something." />
    </form>
</div>
```

```Javascript

$("#input form").on("submit", function(e) {
    e.preventDefault();
    
    incus.MessageAll("chatmessage", {
        "message": $("#chat .input").text()
    });
});

incus.on("chatmessage", function(msg) {
    $("#chat #messages").append($('<div>').text(msg.message));
});

```

## Example 4: Browserify

Incus.js is distributed as a Browserify module. If you already use Browserify, using Incus is easy:

```Javascript
var IncusClient = require('incus');

var incus = new IncusClient('http://localhost:4000', 'UID', '/page/path');

incus.MessageUser('event1', 'uid1', {foo: 3});
```
