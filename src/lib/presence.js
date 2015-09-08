var EventEmitter = require('event-emitter');

var INCUS_COMMAND_SETPRESENCE = 'setpresence';
var MAXIMUM_COMMNANDS_PER_SECOND = 20;

/**
 * Notify Incus when we go from being inactive to active or vice versa.
 */
var Presence = function(inactivityThresholdSeconds) {
    var emitter = new EventEmitter();
    this.emitter = emitter;
    this.on = emitter.on.bind(emitter);
    this.off = emitter.off.bind(emitter);

    this.timerReference = null;
    this.lastActiveTime = null;
    this._lastResetCall = null;
    this.inactivityThresholdSeconds = (typeof inactivityThresholdSeconds !== 'undefined' ? inactivityThresholdSeconds : 60);

    document.body.addEventListener('touchstart', this.handleUserActivity.bind(this));
    document.body.addEventListener('keypress', this.handleUserActivity.bind(this));
    document.body.addEventListener('mousemove', this.handleUserActivity.bind(this));

    this.reset();
};

Presence.prototype = {
    reset: function() {
        var nowUnixTime = (+ new Date() / 1000);

        if(this.lastActiveTime !== null) {
            var wasPresent = (this.lastActiveTime + this.inactivityThresholdSeconds >= nowUnixTime);

            if(!wasPresent) {
                this.emitter.emit('return', this.lastActiveTime, nowUnixTime);
            }
        }

        this.lastActiveTime = nowUnixTime;

        if(this.timerReference !== null) {
            window.clearTimeout(this.timerReference);
        }

        this.timerReference = window.setTimeout(this.handleTimeout.bind(this), this.inactivityThresholdSeconds * 1000);
    },

    handleTimeout: function() {
        this.emitter.emit('idle');
    },

    handleUserActivity: function(e) {
        var nowUnixTimeMsec = (+ new Date);

        // Throttle reset commands
        if(this._lastResetCall === null || this._lastResetCall + (1000 / MAXIMUM_COMMNANDS_PER_SECOND) <= nowUnixTimeMsec) {
            this._lastResetCall = nowUnixTimeMsec;
            this.reset();
        }
    }
};

var IncusNotifier = function(presence, incus) {
    this.presence = presence;
    this.incus = incus;

    presence.on('return', this.handleHere.bind(this));
    presence.on('idle', this.handleIdle.bind(this));

    this.handleHere();
};

IncusNotifier.prototype.notifyIncus = function(options) {
    var command = {
        'command': INCUS_COMMAND_SETPRESENCE
    };

    var message = {
        'presence': options.present
    };

    this.incus.send(this.incus.newCommand(command, message));
};

IncusNotifier.prototype.handleHere = function() {
    this.notifyIncus({
        present: true
    });
};

IncusNotifier.prototype.handleIdle = function() {
    this.notifyIncus({
        present: false
    });
};

Presence.IncusNotifier = IncusNotifier;

module.exports = Presence;
