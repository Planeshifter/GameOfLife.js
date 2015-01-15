/*
Class for grid cells.
Has the following methods:
  update: updates the status (alive/not alive) of the cells given the current number of living neighbours
  countLivingNeighbours: calculate the number of currently living neighbours and store the result in the
  liveNeighbours attribute
*/
function Cell(x, y, grid){
  this.x = x;
  this.y = y;
  this.grid = grid;
  this.alive = false;
  this.liveNeighbours = null;
}

Cell.prototype.update = function(callback){
  this.alive = callback.call(this);
};

Cell.prototype.countLivingNeighbours = function(){
  var count = 0;
  var i_low =  Math.max(this.y - 1, 0);
  var i_high = Math.min(this.y + 1, this.grid.height - 1);
  var j_low = Math.max(this.x - 1, 0);
  var j_high = Math.min(this.x + 1, this.grid.width - 1);
  for (var i = i_low; i <= i_high; i++){
    for (var j = j_low; j <= j_high; j++){
      if (this.grid.rows[i][j].alive === true && !(i === this.y && j === this.x)) count++;
    }
  }
  this.liveNeighbours = count;
};

/*
View class responsible for visual representation of grid.
*/
function View(grid){
  var self = this;
  this.table = $("#grid_table");

  this.update = function () {
      grid.traverse(function (cell) {
          if (cell.alive === true) {
              cell.element.addClass('alive');
          } else {
              cell.element.removeClass('alive');
          }
      });
  };

  this.init = function(){
     self.table.empty();
     self.table.addClass("grid_table");
          var x, y, tr, td, cell;
          allCells = [];

          for (y = 0; y < grid.height; y++) {
              tr = $('<tr>');
              for (x = 0; x < grid.width; x++) {
                  td = $("<td>");
                  td.addClass('cell');

                  cell = grid.rows[y][x];
                  cell.element = td;

                  td.attr("x",x);
                  td.attr("y",y);

                  tr.append(td);
              }
              self.table.append(tr);
          }

          $("#grid_table td").click(function(){
              cell = grid.rows[$(this).attr("y")][$(this).attr("x")];
              cell.alive = cell.alive ? false : true;
              self.update();
          });
  };
}

/*
grid class; constructor takes width and height as parameters.
Instances have the following methods:
  init: initializes the 2d grid matrix of cells
  resize(gridWidth, gridHeight): resized the grid matrix stored in rows to the new dimensions
  traverse(callback): apply the supplied callback function to all grid cells. The callback function receives
  as its first argument the cell, and the x- and y-coordinate as its second and third argument, respectively.
  step: carries out one step in the simulation of the "Game of Life"
*/
function Grid(gridWidth, gridHeight){
    var self = this;
    this.width = gridWidth || 50;
    this.height = gridHeight || 50;
    this.rows = [];
    this.nsteps = null;
    this.current_step = null;
    this.timer = null;
    this.view = null;

    this.init = function(){
            var row;
            self.rows = [];
            for (var y = 0; y < self.height; y++) {
                row = [];
                for (var x = 0; x < self.width; x++) {
                    var ncell = new Cell(x, y, self);
                    row.push(ncell);
                }
                self.rows.push(row);
            }
    };

    this.resize = function(gridWidth, gridHeight){
      self.width = gridWidth || 50;
      self.height = gridHeight || 50;
      self.init();
    };

    this.traverse = function(callback){
      for (var y = 0; y < self.height; y++) {
        for (var x = 0; x < self.width; x++) {
          callback(self.rows[y][x], x, y);
        }
      }
    };

    this.step = function(){
      if(self.current_step < self.nsteps){
        console.log("Calculating round " + self.current_step);
        self.traverse(function(cell){
          cell.countLivingNeighbours();
        });
        self.traverse(function(cell){
          cell.update(function(){
            if (this.alive === true){
              return (this.liveNeighbours === 2 || this.liveNeighbours === 3) ? true : false;
            } else if (this.liveNeighbours === 3){
              return true;
            }
          });
        });
        self.view.update();
        self.current_step++;
      } else {
        clearInterval(self.timer);
      }
    };
}


/*
set up grid and register event handlers
*/
$(document).ready(function(){
  var grid = new Grid(25, 25);
  var view = new View(grid);
  grid.view = view;
  grid.init();
  view.init();

  $('#create_grid_btn').click(function(){

    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];
    var width, height;

    if (!file){
      width = $("#input_width").val();
      height = $("#input_height").val();
      grid.resize(width, height);
      view.init();
    } else {
      var reader = new FileReader();
      var rows;
      reader.onload = function (e) {
        rows = reader.result.split('\n');
        for(var key in rows){
          rows[key] = rows[key].split(' ');
        }
        width = rows[0].length;
        height = rows.length - 1;
        grid.resize(width, height);
        view.init();
        grid.traverse(function(cell, x, y){
          if (rows[y][x] == 1){
            cell.alive = true;
          }
        });
        view.update();
      };
      reader.readAsText(file);
    }
  });

  $('#start_game_btn').click(function(){
    var speed = $("#speed_input").val() || 200;
    grid.nsteps = $("#nsteps_input").val() || 10;
    grid.current_step = 0;
    grid.timer = setInterval(grid.step, speed);
  });

});
