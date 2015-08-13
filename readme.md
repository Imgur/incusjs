Incus.js [![Build Status](https://travis-ci.org/jacobgreenleaf/incusjs.svg)](https://travis-ci.org/jacobgreenleaf/incusjs)
=== 

JavaScript bindings for talking to an [Incus](http://github.com/Imgur/incus) server

## Usage

    var incus = new Incus.Client('http://rt.imgur.com', 'User1', '/');

    incus.on('points', function(data) {
        console.log('Received points update! ', data);
    });

    incus.on('message', function(message) {
        console.log('New message! ', message);
    });


