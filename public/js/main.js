const socket = io();

let gameLoaded = false;
let gameInProgress = false;
let waitingForOpponent = false;
let myTurn = false;

const startGameButton = document.querySelector('.start-game-btn');

const randomizeLink = document.createElement('a');
randomizeLink.textContent = 'Randomize';
randomizeLink.setAttribute("style", "margin-left: 15px;");

let headerDiv = document.createElement('div');
let gridColumns = document.createElement('div');
let playerZone = document.createElement('div');
let opponentZone = document.createElement('div');

let menuBar = document.createElement('p');
let opponetInfo = document.createElement('span');
let gameInfoArea = document.createElement('span');

let modalDiv = document.createElement('div');
let notificationModal = '<div class="modal"><div class="modal-background"></div><div class="modal-card">'
                + '<section class="modal-card-body"></section><footer class="modal-card-foot">'
                + '<button class="button" id="modalCloseButton">Close</button>'
                + '</footer></div></div >';

modalDiv.innerHTML = notificationModal;

gameInfoArea.classList.add('gameInfoArea');
gameInfoArea.textContent = "Game Not Started";
opponetInfo.textContent = "Opponent Grid: Other Player";
opponetInfo.style.marginRight = "15px";

menuBar.appendChild(opponetInfo);
menuBar.appendChild(gameInfoArea);
menuBar.setAttribute("style", "margin-bottom: 15px;");

document.querySelector('.game_content').appendChild(headerDiv);
document.querySelector('.game_content').appendChild(gridColumns);
document.querySelector('.game_content').appendChild(modalDiv);

gridColumns.classList.add("columns", "grid-columns");

let ships = [];
let Ncells = 10;

// Start Game
socket.emit('init_game');

//Message from server
socket.on('message', message => {
    outputMessage(message);
});

//Total players
socket.on('total-players', totalPlayers => {
    document.querySelector('.online-count').textContent = totalPlayers + " PLAYERS ONLINE";
});

//Got opponent
socket.on('game-start', message => {
    gameInProgress = true;
    waitingForOpponent = false;
    startGameButton.disabled = true;
    startGameButton.textContent = "Start Game";
    console.log("Game Started");
    console.log(message);
    if (message.yourTurn) {
        myTurn = true;
        gameInfoArea.textContent = "Your Turn";
    }
    else {
        gameInfoArea.textContent = "Opponent Turn";
    }
    //outputMessage(message);
});

//Client Initial Game
socket.on('initial_game', message => {
    ships = message;
    displayBoard();
    putShipsOnBoard();
    opponentGrid();
    gameLoaded = true;
});

//Client another game
socket.on('another_game', message => {
    ships = message;
    putShipsOnBoard();
    gameLoaded = true;
});

//Opponent has left game
socket.on('opponent-left', message => {
    startGameButton.disabled = false;
    gameInProgress = false;
    waitingForOpponent = false;
    outputMessage(message);
});

//Game Result
socket.on('game-result', message => {
    let result = message.result;
    myTurn = message.yourTurn;
    let clickedCell = "td_" + message.cell;
    gameInProgress = true;
    displayTurn();

    if (result == 'correct-hit') {
        document.querySelector("." + clickedCell).classList.add("markedCell");
        document.querySelector("." + clickedCell).innerHTML = "<span class='close'></span>";
        markNeighborCells(message.cellsToMark, 'opponent-board');

        if(message.gameOver){ //Player has won
            gameInProgress = false;
            myTurn = false;
            gameInfoArea.textContent = "Game Over";
            document.querySelector(".modal").classList.add('is-active');
            document.querySelector(".modal-card-body").style.backgroundColor = 'green';
            document.querySelector(".modal-card-body").innerHTML = '<p class="subtitle is-4" style="color:white !important;">Congratulations! You won!</p>';
            document.querySelector(".modal-card-foot").style.backgroundColor = 'green';
        }
    }
    else if (result == 'opponent-hit') {
        //opponent clicked the right cell
        document.getElementById("myTableTD_" + message.cell).classList.add("markedCell");
        document.getElementById("myTableTD_" + message.cell).innerHTML = "<span class='close closeForMyBoard'></span>";
        markNeighborCells(message.cellsToMark, 'my-board');

        if(message.gameOver){ //Player has lost
            gameInProgress = false;
            myTurn = false;
            gameInfoArea.textContent = "Game Over";
            document.querySelector(".modal").classList.add('is-active');
            document.querySelector(".modal-card-body").style.backgroundColor = 'red';
            document.querySelector(".modal-card-body").innerHTML = '<p class="subtitle is-4" style="color:white !important;">Game over! You lost!</p>';
            document.querySelector(".modal-card-foot").style.backgroundColor = 'red';
        }
    }
    else if (result == 'miss') {
        document.querySelector("." + clickedCell).innerHTML = "<span class='dot'></span>";
        document.querySelector("." + clickedCell).classList.add('missedCell');
    }
    else if (result == 'opponent-miss') {
        //opponent missed
        document.getElementById("myTableTD_" + message.cell).innerHTML = "<span class='dot'></span>";
        document.getElementById("myTableTD_" + message.cell).classList.add('missedCell');
    }
});

//Modal close
let modalCloseButton = document.getElementById("modalCloseButton");
modalCloseButton.addEventListener('click', () => {
    document.querySelector(".modal").classList.remove("is-active");
});

//Start Game
startGameButton.addEventListener('click', () => {
    if (!gameInProgress && !waitingForOpponent && gameLoaded) {
        startGameButton.textContent = 'Waiting for Opponent';
        startGameButton.disabled = true;
        waitingForOpponent = true;
        socket.emit('get_opponent');
    }
});

//Get another randomized game
randomizeLink.addEventListener('click', () => {
    if (!gameInProgress && !waitingForOpponent) {
        gameLoaded = false;
        startGameButton.setAttribute("disabled", "true");
        socket.emit("randomize");
    }
    else {
        alert("Another game is in progress");
    }
});

// Output message to DOM
function outputMessage(message) {
    const welcomeMessage = `<p class="subtitle"><span>${message.time}</span>&nbsp;<span>${message.text}</span></p>`;
    headerDiv.innerHTML = welcomeMessage;
}

function displayBoard() {
    playerZone.classList.add('is-half', 'column');
    playerZone.innerHTML = '';
    let menuBar = document.createElement('p');
    menuBar.textContent = "Your Grid";
    menuBar.setAttribute("style", "margin-bottom: 15px;");
    menuBar.appendChild(randomizeLink);

    playerZone.appendChild(menuBar);

    let board = document.createElement('table');
    board.classList.add('table', 'is-bordered');
    for (let i = 0; i < Ncells; ++i) {
        let row = document.createElement('tr');
        row.id = "tr" + i;
        for (let j = 0; j < Ncells; ++j) {
            let col = document.createElement('td');
            col.classList.add("myBoardTD");
            let id = j + Ncells * i;
            col.id = "myTableTD_" + id;
            row.appendChild(col);
        }
        board.appendChild(row);
    }

    playerZone.appendChild(board);

    document.querySelector('.grid-columns').appendChild(playerZone);
}

function putShipsOnBoard() {
    const cls = ["firstVertical", "firstHorizontal", "lastHorizontal", "lastVertical", "insideCellVertical", "insideCellHorizontal", "onlyCell", 'neighbourMarked', 'markedCell', 'missedCell'];

    //clear board
    for (var i = 0; i < Ncells * Ncells; i++) {
        let thisCell = document.getElementById('myTableTD_' + i);
        thisCell.classList.remove(...cls);
        thisCell.innerHTML = '';
    }

    ships.forEach(ship => {
        let i = 0;
        let coveringCells = ship.cells;
        coveringCells.sort((a, b) => a - b);
        console.log(coveringCells);
        coveringCells.forEach(cellId => {
            let tdClassName = "";
            if (i == 0 && (ship.orientation == 'vertical-down' || ship.orientation == 'vertical-up') && ship.cells.length != 1) {
                tdClassName = 'firstVertical';
            }
            else if (i == 0 && (ship.orientation == 'horizontal-right' || ship.orientation == 'horizontal-left') && ship.cells.length != 1) {
                tdClassName = 'firstHorizontal';
            }
            else if (i == (ship.cells.length - 1) && (ship.orientation == 'horizontal-right' || ship.orientation == 'horizontal-left') && ship.cells.length != 1) {
                tdClassName = 'lastHorizontal';
            }
            else if (i == (ship.cells.length - 1) && (ship.orientation == 'vertical-down' || ship.orientation == 'vertical-up') && ship.cells.length != 1) {
                tdClassName = 'lastVertical';
            }
            else if ((ship.orientation == 'vertical-down' || ship.orientation == 'vertical-up') && ship.cells.length != 1) {
                tdClassName = 'insideCellVertical';
            }
            else if ((ship.orientation == 'horizontal-right' || ship.orientation == 'horizontal-left') && ship.cells.length != 1) {
                tdClassName = 'insideCellHorizontal';
            }

            if (ship.cells.length == 1) {
                tdClassName = 'onlyCell';
            }

            document.getElementById('myTableTD_' + cellId).classList.add(tdClassName);
            i++;
        });
    });

    startGameButton.removeAttribute("disabled");
}

function opponentGrid() {
    opponentZone.classList.add('is-half', 'column');

    opponentZone.appendChild(menuBar);

    let tablediv = document.createElement('div');
    let board = document.createElement('table');
    let tbody = document.createElement('tbody');

    tablediv.classList.add('tableDiv');
    board.appendChild(tbody);
    board.classList.add('table', 'is-bordered', 'opponentBoard');

    for (let i = 0; i < Ncells; ++i) {
        let row = document.createElement('tr');
        row.id = "tr" + i;
        for (let j = 0; j < Ncells; ++j) {
            let col = document.createElement('td');

            let id = j + Ncells * i;
            col.id = "td_" + id;
            //col.textContent = id;
            row.appendChild(col);

            col.classList.add('tableCell');
            col.classList.add("opponentCell" + id);

            col.addEventListener('click', event => {
                if (gameInProgress && myTurn && !col.classList.contains('markedCell')) {
                    myTurn = false;
                    col.classList.remove('hoveredTableCell');
                    col.classList.add("td_" + id);
                    socket.emit('cell-clicked', id);
                }
            });

            col.addEventListener('mouseover', event => {
                if (gameInProgress && myTurn && !col.classList.contains('markedCell')) {
                    col.classList.add('hoveredTableCell');
                }
            });

            col.addEventListener('mouseout', event => {
                if (gameInProgress && myTurn && !col.classList.contains('markedCell')) {
                    col.classList.remove('hoveredTableCell');
                }
            });
        }
        tbody.appendChild(row);
    }

    tablediv.appendChild(board);
    opponentZone.appendChild(tablediv);

    document.querySelector('.grid-columns').appendChild(opponentZone);
}

function displayTurn() {
    if (myTurn) {
        gameInfoArea.textContent = "Your Turn";
    }
    else {
        gameInfoArea.textContent = "Opponent turn";
    }
}


function markNeighborCells(neighbourCells, playerBoard) {
    if (playerBoard == 'opponent-board') {
        neighbourCells.forEach(cell => {
            document.querySelector('.opponentCell' + cell).innerHTML = "<span class='dot'></span>";
            document.querySelector('.opponentCell' + cell).classList.add('neighbourMarked');
        });
    }
    else {
        neighbourCells.forEach(cell => {
            document.getElementById('myTableTD_' + cell).innerHTML = "<span class='dot'></span>";
            document.getElementById('myTableTD_' + cell).classList.add('neighbourMarked');
        });
    }
}