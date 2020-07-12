const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { generateGame, getRandomInt, getDiagonalNeighbours, getCellNeighbours} = require('./utils/game_generator');

const {
    playerJoin,
    getCurrentPlayer,
    playerLeave,
    removePlayer,
    playerStates
} = require("./utils/players");
const { start } = require('repl');

const CronJob = require('cron').CronJob;

const cronjob = new CronJob('* * 0 * * *', function () {
    console.log("[Cron]")
    console.log("\tusers connected:", io.engine.clientsCount);
}, null, true, 'Europe/Paris');
cronjob.start();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'Server';

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

let availableRooms = [];

io.on("connection", socket => {
    const game = [];
    const player = playerJoin(socket.id, game);
    let roomName = null;

    io.emit('total-players', io.engine.clientsCount);

    //Player initial random game
    socket.on("init_game", () => {
        //Welcome player
        socket.emit('message', formatMessage(botName, 'Welcome to Battleship!'));

        let game = generateGame();

        let player = getCurrentPlayer(socket.id);
        player.game = game;
        socket.emit('initial_game', game.allShips);
    });

    //Player ask for another random game
    socket.on("randomize", () => {
        let game = generateGame();

        let player = getCurrentPlayer(socket.id);
        player.game = game;
        socket.emit('another_game', game.allShips);
    });

    //Player starts game
    //Find opponent
    socket.on("get_opponent", () => {
        let player = getCurrentPlayer(socket.id);
        //player.playerState = playerStates.searching_opponent;
        console.log("someone looking for player " + socket.id);

        if (availableRooms.length) {
            roomName = availableRooms.shift();
            socket.join(roomName);

            let details = roomName.split("game");
            player.opponent = details[1];

            let opponent = getCurrentPlayer(details[1]);
            opponent.opponent = socket.id;

            player.roomName = roomName;
            opponent.roomName = roomName;

            console.log("An available room ( " + roomName + " ) was joined");

            //The game can be started
            //Decide who can start game and notify players
            let roomPlayers = [socket.id, opponent.id];
            console.log(roomPlayers);
            let starter = roomPlayers[getRandomInt(0, 1)];
            console.log(starter);
            if (socket.id == starter) {
                player.myTurn = true;
                opponent.myTurn = false;
                socket.emit('game-start', { yourTurn: true });
            }
            else {
                player.myTurn = false;
                opponent.myTurn = true;
                socket.emit('game-start', { yourTurn: false });
                io.to(opponent.id).emit('game-start', { yourTurn: true });
            }

            //io.to(roomName).emit('opponent', formatMessage(botName, 'You joined room ' + roomName));

        }
        else {
            availableRooms.push("game" + socket.id);
            socket.join("game" + socket.id);
            console.log("No available room ! A new one has been created");
        }
    });

    //Player clicks cell
    socket.on('cell-clicked', cellId => {
        let player = getCurrentPlayer(socket.id);
        if (player !== undefined) {
            if (player.myTurn) {
                let opponentId = player.opponent;
                if (opponentId !== undefined) {
                    let opponent = getCurrentPlayer(opponentId);
                    let opponentGame = opponent.game.allShips;
                    
                    let hitShip =  opponentGame.find(ship => ship.cells.includes(cellId));
                    
                    if(hitShip !== undefined){//Player clicked on the correct cell
                        player.myTurn = true; //maintain turn
                        opponent.myTurn = false;

                        hitShip.destroyedCells.push(cellId);

 
                        let cellsToMark = [];

                        //Get cells to mark
                        //If all the cells return all the neighbours of cells covering the ship
                        if(hitShip.destroyedCells.length === hitShip.shipSize){
                            hitShip.cells.forEach(cell => {
                                let thisCellNeighbours = getCellNeighbours(cell);
                                cellsToMark = cellsToMark.concat(thisCellNeighbours);
                            });

                            cellsToMark =  cellsToMark.filter(cell => !hitShip.cells.includes(cell));
                        }
                        else{
                            cellsToMark = getDiagonalNeighbours(cellId);
                        }
                        

                        //Check if game over
                        let gameOver = true;
                        opponentGame.forEach(ship => {
                            if(ship.cells.length > ship.destroyedCells.length){
                                gameOver = false;
                            }
                        });


                        //Send to player cells to mark
                        //Send to opponent the hit cell
                        socket.emit('game-result', {cellsToMark: cellsToMark, yourTurn: true, cell: cellId, result:'correct-hit', gameOver:gameOver});
                        io.to(opponent.id).emit('game-result', { cell: cellId, cellsToMark:cellsToMark, yourTurn: false, result:'opponent-hit', gameOver:gameOver});
                    }
                    else{
                        //Player missed
                        //Switch turns
                        player.myTurn = false;
                        opponent.myTurn = true;

                        //Notify all players
                        socket.emit('game-result', { yourTurn: false, cell: cellId, result:'miss' });
                        io.to(opponent.id).emit('game-result', { cell: cellId, yourTurn: true, result:'opponent-miss' });
                    }
                }
                else {
                    //Likely opponent left the game
                }
            }
        }
        //Else something wrong happenned. Likely he is disconnected and this is late message
    });


    //Handle Disconnection
    socket.on('disconnect', () => {
        io.emit('total-players', io.engine.clientsCount);
        console.log("user " + socket.id + " disconnected");
        let roomInAvailable = "game" + socket.id;

        //Remove  from available rooms
        for (var i = 0; i < availableRooms.length; i++) {
            if (availableRooms[i] === roomInAvailable) {
                availableRooms.splice(i, 1);
                break;
            }
        }

        let player = getCurrentPlayer(socket.id);
        let opponent = player.opponent;

        //notify opponent
        if (opponent != undefined) {
            opponent.opponent = undefined;
            opponent.roomName = undefined;
            opponent.game = undefined;
            io.to(opponent).emit('opponent-left', formatMessage(botName, 'Your opponent has left the game'));
        }

        //Remove player from players list
        removePlayer(socket.id);
    })
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


//Testing game generation correctness

// let total_trials = 0;
// let faulty_game = false;
// while(total_trials < 1 && !faulty_game){
//     const game = generateGame();

//     const allShips = game.allShips;
//     const cells = game.cells;

//     allShips.forEach(ship => {
//         const covering_cells = ship.cells;

//         if(covering_cells.length != ship.shipSize){
//             faulty_game = true;
//         }

//         covering_cells.forEach(cellId => {
//             let cell = cells.find(c => c.cellId == cellId);
//             let neighbours = cell.neighbours;

//             neighbours.forEach(cellId => {
//                 let cellNeighbour = cells.find(c => c.cellId == cellId);
//                 console.log(cellNeighbour);
//                 if(cellNeighbour.shipId != undefined && cellNeighbour.shipId != cell.shipId){
//                     faulty_game = true;
//                 }
//             });
//         });
//     });

//     if(faulty_game){
//         console.log("Found faulty game on iteration " + total_trials);
//         console.log(cells);
//     }
//     total_trials++;
// }

