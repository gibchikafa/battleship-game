const Ncells = 10;

const RIGHT_ORIENTATION = "horizontal-right";
const LEFT_ORIENTATION = "horizontal-left";
const DOWN_ORIENTATION = "vertical-down";
const UP_ORIENTATION = "vertical-up";


function generateGame() {
    const cells = initCells();
    const allShips = initShips();
    placeShips(allShips, cells);
    //console.log(cells);
    return {allShips:allShips, cells:cells};
}

function initShips(ships){
    let ship1 = new Ship(1, 4);
    let ship2 = new Ship(2, 3);
    let ship3 = new Ship(3, 3);
    let ship4 = new Ship(4, 2);
    let ship5 = new Ship(5, 2);
    let ship6 = new Ship(6, 2);
    let ship7 = new Ship(7, 1);
    let ship8 = new Ship(8, 1);
    let ship9 = new Ship(9, 1);
    let ship10 = new Ship(10, 1);
    
    return [ship1, ship2, ship3, ship4, ship5, ship6, ship7, ship8, ship9, ship10];
}

//Diagonal Neighbours
function getDiagonalNeighbours(cellId) {
    var cellNeighbours = [];

    //top left diagonal
    if ((cellId - Ncells - 1) > 0 && cellId % Ncells != 0) {
        cellNeighbours.push(cellId - Ncells - 1);
    }

    //bottom left diagonal
    if ((cellId + Ncells - 1) < (Ncells * Ncells - 1) && cellId % Ncells != 0) {
        cellNeighbours.push(cellId + Ncells - 1);
    }

    //top right diagonal
    if ((cellId - Ncells + 1) > 0 && (cellId + 1) % Ncells != 0) {
        cellNeighbours.push(cellId - Ncells + 1);
    }

    //bottom right diagonal
    if (cellId + Ncells + 1 < (Ncells * Ncells - 1) && (cellId + 1) % Ncells != 0) {
        cellNeighbours.push(cellId + Ncells + 1);
    }

    return cellNeighbours;
}
//get neighbouring cells. Returns an array
function getCellNeighbours(cellId) {
    var cellNeighbours = [];

    //up neighbour
    if (cellId - Ncells >= 0) {
        cellNeighbours.push(cellId - Ncells);
    }

    // down neighbour
    if (cellId + Ncells <= (Ncells * Ncells) - 1) {
        cellNeighbours.push(cellId + Ncells);
    }

    //right neighbour. last column cells have no right neighbour
    if ((cellId + 1) < ((Ncells * Ncells) - 1) && ((cellId + 1) % Ncells) != 0) {
        cellNeighbours.push(cellId + 1);
    }

    //left neighbour. first column cells have no left neighbour
    if (cellId % Ncells != 0) {
        cellNeighbours.push(cellId - 1);
    }

    //top left diagonal
    if ((cellId - Ncells - 1) > 0 && cellId % Ncells != 0) {
        cellNeighbours.push(cellId - Ncells - 1);
    }

    //bottom left diagonal
    if ((cellId + Ncells - 1) < (Ncells * Ncells - 1) && cellId % Ncells != 0) {
        cellNeighbours.push(cellId + Ncells - 1);
    }

    //top right diagonal
    if ((cellId - Ncells + 1) > 0 && (cellId + 1) % Ncells != 0) {
        cellNeighbours.push(cellId - Ncells + 1);
    }

    //bottom right diagonal
    if (cellId + Ncells + 1 < (Ncells * Ncells - 1) && (cellId + 1) % Ncells != 0) {
        cellNeighbours.push(cellId + Ncells + 1);
    }

    return cellNeighbours;
}

function Cell(cellId, free) {
    this.cellId = cellId;
    this.free = free;
    this.shipId = undefined;
    this.neighbours = getCellNeighbours(cellId);
    this.belowCells = Ncells - Math.floor(this.cellId / Ncells) - 1;
    this.aboveCells = Ncells - this.belowCells - 1;
    this.rightCells = Ncells - (this.cellId % Ncells) - 1;
    this.leftCells = Ncells - this.rightCells - 1;
}

function Ship(shipId, size) {
    this.shipId = shipId;
    this.shipSize = size;
    this.orientation = undefined;
    this.cells = [];
    this.destroyedCells = [];
}

function initCells() {
    let cells = [];
    for (var i = 0; i < Ncells*Ncells; i++) {
        var cell = new Cell(i, true);
        cells.push(cell);
    }

    return cells;
}

//the cells that the ship is to be put on
function getShipCoveringCells(ship, cellId) {
    var coveringCells = [cellId];
    if (ship.orientation == RIGHT_ORIENTATION) {
        for (var i = 1; i < ship.shipSize; i++) {
            coveringCells.push(cellId + i);
        }
    }
    else if (ship.orientation == LEFT_ORIENTATION) {
        for (var i = 1; i < ship.shipSize; i++) {
            coveringCells.push(cellId - i);
        }
    }
    else if (ship.orientation == DOWN_ORIENTATION) {
        for (var i = 1; i < ship.shipSize; i++) {
            coveringCells.push(cellId + (i * Ncells));
        }
    }
    else if (ship.orientation == UP_ORIENTATION) {
        for (var i = 1; i < ship.shipSize; i++) {
            coveringCells.push(cellId - (i * Ncells));
        }
    }

    return coveringCells.sort((a, b) => a - b);
}

function getPlacingOptions(cell, ship, cells) {
    var placingOptions = [];

    if (cell.rightCells + 1 >= ship.shipSize) {
        var rightCells = cell.rightCells;
        var totalFreeCells = 0;
        for (var i = 1; i <= rightCells; i++) {
            var nextCell = cells[cell.cellId + i];

            if (!nextCell.free) {
                break;
            }
            else {
                totalFreeCells++;
            }
        }

        //consider this cell
        if (totalFreeCells + 1 >= ship.shipSize) {
            placingOptions.push(RIGHT_ORIENTATION);
        }
    }

    if (cell.leftCells + 1 >= ship.shipSize) {
        var leftCells = cell.leftCells;
        var totalFreeCells = 0;
        for (var i = 1; i <= leftCells; i++) {
            var nextCell = cells[cell.cellId - i];
            if (!nextCell.free) {
                break;
            }
            else {
                totalFreeCells++;
            }
        }

        //consider this cell
        if (totalFreeCells + 1 >= ship.shipSize) {
            placingOptions.push(LEFT_ORIENTATION);
        }
    }

    if (cell.belowCells + 1 >= ship.shipSize) {
        var belowCells = cell.belowCells;
        var totalFreeCells = 0;
        for (var i = 1; i <= belowCells; i++) {
            var nextCell = cells[cell.cellId + (i * Ncells)];
            if (!nextCell.free) {
                break;
            }
            else {
                totalFreeCells++;
            }
        }

        //consider this cell
        if (totalFreeCells + 1 >= ship.shipSize) {
            placingOptions.push(DOWN_ORIENTATION);
        }
    }

    if (cell.aboveCells + 1 >= ship.shipSize) {
        var aboveCells = cell.aboveCells;
        var totalFreeCells = 0;
        for (var i = 1; i <= aboveCells; i++) {
            var nextCell = cells[cell.cellId - (i * Ncells)];
            if (!nextCell.free) {
                break;
            }
            else {
                totalFreeCells++;
            }
        }

        //consider this cell
        if (totalFreeCells + 1 >= ship.shipSize) {
            placingOptions.push(UP_ORIENTATION);
        }
    }

    return placingOptions;
}

//marks the cells occupied by the ship including their neighbours as not free
function markCellsNotFree(coveringCells, cells) {
    for (var i = 0; i < coveringCells.length; i++) {
        var cell = cells[coveringCells[i]];
        cell.free = false;
        var neighbours = cell.neighbours;
        for (var j = 0; j < neighbours.length; j++) {
            cells[neighbours[j]].free = false;
        }
    }

    return cells;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function placeShips(allShips, cells) {

    for (var i = 0; i < allShips.length; i++) {
        var ship = allShips[i];
        var placed = false;

        var counter = Ncells * Ncells;
        while (!placed && counter >= 0) {
            //generate random cell to place ship
            var cellId = getRandomInt(0, (Ncells * Ncells) - 1);
            var cell = cells[cellId];
            if (cell.free) {
                var placingOptions = getPlacingOptions(cell, ship, cells);
                // console.log(ship);
                // console.log("Placing ship size " + ship.shipSize);
                // console.log("Placing options is " + placingOptions);
                if (placingOptions.length > 0) {
                    var coveringCells = [];
                    if (placingOptions.length == 1) {
                        ship.orientation = placingOptions[0];
                        coveringCells = getShipCoveringCells(ship, cellId);
                    }
                    else {
                        var j = getRandomInt(0, placingOptions.length - 1);
                        var orientation = placingOptions[j];

                        ship.orientation = orientation;
                        coveringCells = getShipCoveringCells(ship, cellId);
                    }
                    // console.log("Selected orientation " + ship.orientation);
                    // console.log("Covering cells is " + coveringCells);

                    //Set ship id for all covering cells
                    coveringCells.forEach(cellId => {
                        var coveringCell = cells.find(c => c.cellId == cellId);
                        coveringCell.shipId = ship.shipId;
                    });

                    ship.cells = coveringCells;
                    markCellsNotFree(coveringCells, cells);
                    placed = true;
                }
            }

            counter--;
        }
    }

    return allShips;
}

module.exports = {
    generateGame,
    getRandomInt,
    getCellNeighbours,
    getDiagonalNeighbours
}