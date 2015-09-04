var INCUS_COMMAND_SETPRESENCE = 'setpresence';
var MAXIMUM_COMMNANDS_PER_SECOND = 20;

/**
 * Notify Incus when we go from being inactive to active or vice versa.
 */
var Presence = function(incus, inactivityThresholdSeconds) {
    this.incus = incus;
    this.timerReference = null;
    this.lastActiveTime = null;
    this._lastResetCall = null;
    this.inactivityThresholdSeconds = (typeof inactivityThresholdSeconds !== 'undefined' ? inactivityThresholdSeconds : 60);

    document.body.addEventListener('touchstart', this.handleUserActivity.bind(this));
    document.body.addEventListener('keypress', this.handleUserActivity.bind(this));
    document.body.addEventListener('mousemove', this.handleUserActivity.bind(this));

    this.reset();

    this.notifyIncus({
        present: true
    });
};

Presence.prototype = {
    reset: function() {
        var nowUnixTime = (+ new Date / 1000);

        if(this.lastActiveTime !== null) {
            var wasPresent = (this.lastActiveTime + this.inactivityThresholdSeconds >= nowUnixTime);

            if(!wasPresent) {
                this.notifyIncus({
                    present: true
                });
            }
        }

        this.lastActiveTime = nowUnixTime;

        if(this.timerReference !== null) {
            window.clearTimeout(this.timerReference);
        }

        this.timerReference = window.setTimeout(this.handleTimeout.bind(this), this.inactivityThresholdSeconds * 1000);
    },

    notifyIncus: function(options) {
        var command = {
            'command': INCUS_COMMAND_SETPRESENCE
        };

        var message = {
            'presence': options.present
        };

        this.incus.send(this.incus.newCommand(command, message));
    },

    handleTimeout: function() {
        this.notifyIncus({
            present: false
        });
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

module.exports = Presence;
