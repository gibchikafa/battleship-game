const players = [];
const playerStates = {
    joined: 'join',
    playing: 'playing',
    searching_opponent: 'searching for opponent'
};

// Join player to list of players
function playerJoin(id, game) {
    const opponent = undefined;
    const playerState = playerStates.joined;
    const roomName = undefined;
    const myTurn = false;
    const player = { id, opponent, game, playerState, roomName, myTurn};

    players.push(player);

    return players;
}

// Get current player
function getCurrentPlayer(id) {
    return players.find(player => player.id === id);
}

// Player leaves game
function playerLeave(id) {
    const index = players.findIndex(player => player.id === id);

    if (index !== -1) {
        return players.splice(index, 1)[0];
    }
}

//Find player looking for opponet
function findPlayerLookingForOpponent(id){
    return players.find(player => player.id !== id && player.playerState === playerStates.searching_opponent);
}


//Remove player
function removePlayer(id){
    for (var i = 0; i < players.length; i++) {
        if (players[i] === id) {
            players.splice(i, 1);
            break;
        }
    }
}

// Get room users
// function getRoomUsers(room) {
//     return users.filter(user => user.room === room);
// }

module.exports = {
    playerJoin,
    getCurrentPlayer,
    playerLeave,
    removePlayer,
    playerStates
};