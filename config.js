exports.config = {
    talker: {name: "Node"},
    listen: {host: undefined, // undefined to listen on all addresses
             port: 5555
            },

    /* Modes that will be loaded for every user on login */
    defaultModes: [],

    /* Modes which may be started by the user. The key is the command
     * to start the mode. */
    userModes: {},

    messages : {
        logout: "Rerouting perception to local reality sensors"
    }
};
