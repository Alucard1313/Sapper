"use strict";

/**
 *
 * @type {*|jQuery|HTMLElement}
 */
var gameTable = $('#game-table');
/**
 *
 * @type {*|jQuery|HTMLElement}
 */
var smileButton = $('#smile_button');

/**
 *
 * @param min
 * @param max
 * @returns {*}
 */
var getRand = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

/**
 *
 * @param l
 * @param c
 * @returns {*|{}|jQuery}
 */
function getCell(l, c) {
    return $('table#game-table').find('tr[data-line="' + l + '"]').find('td[data-column="' + c + '"]');
}

/**
 * Grid class.
 * @param lines
 * @param columns
 * @param bombs
 * @constructor
 */
function Grid(lines, columns, bombs) {

    /**
     * @private
     */
    var _lines = lines;
    /**
     * @private
     */
    var _columns = columns;
    /**
     * @private
     */
    var _bombCount = bombs;
    /**
     * bombs position
     * @type {Array}
     * @private
     */
    var _bombs = [];
    /**
     * grid
     * @type {Array}
     * @private
     */
    var _grid = [];


    this.init = function () {
        _grid = _initGrid();
        //add bombs
        for (var i = 0; i < _bombCount; i++) {
            _addBomb();
        }
        _setNumbers();
    };

    /**
     *
     * @returns {Array}
     * @private
     */
    function _initGrid() {

        //init default grid
        var grid = [];
        for (var i = 0; i < _lines; i++) {
            grid[i] = [];
            for (var j = 0; j < _columns; j++) {
                grid[i][j] = 0;
            }
        }

        return grid;
    }

    /**
     * set bombs
     * @private
     */
    function _addBomb() {
        var line = getRand(0, _lines);
        var column = getRand(0, _columns);
        if (_grid[line][column] == 9) {
            _addBomb();
        } else {
            _grid[line][column] = 9;
            _bombs.push([line, column]);
        }

    }

    /**
     * set numbers
     * @private
     */
    function _setNumbers() {
        for (var i = 0; i < _lines; i++) {
            for (var j = 0; j < _columns; j++) {
                if (_grid[i][j] != 9) {
                    _grid[i][j] = _setNumber(i, j);
                }
            }
        }
    }

    /**
     *
     * @param i
     * @param j
     * @returns {number}
     * @private
     */
    function _setNumber(i, j) {
        var num = 0;
        var ls = [i - 1, i, i + 1];
        var cs = [j - 1, j, j + 1];
        $.each(ls, function (index, nl) {
            if (nl >= 0 && nl < _lines) {
                $.each(cs, function (index2, ns) {
                    if (ns >= 0 && ns < _columns) {
                        if (_grid[nl][ns] == 9) {
                            num++;
                        }
                    }
                });
            }
        });
        return num;

    }


    /**
     *
     * @returns {Array}
     */
    this.getGrid = function () {
        return _grid;
    };

    /**
     *
     * @param l
     * @param c
     * @returns {*}
     */
    this.getVal = function (l, c) {
        return _grid[l][c];
    };

    /**
     *
     * @returns {Array}
     */
    this.getBombs = function () {
        return _bombs;
    };

    /**
     *
     * @returns {*}
     */
    this.getBombCount = function () {
        return _bombCount;
    }

}

/**
 * Game class. Used for render filed, working handler, and etc
 * @constructor
 */
function Game() {
    /**
     * Number of columns
     * @type {*|jQuery}
     * @private
     */
    var _width = $('#width').val();

    /**
     * Number of rows
     * @type {*|jQuery}
     * @private
     */
    var _height = $('#height').val();

    /**
     * Bomb count (can be changed. Use for counter in header)
     * @type {*|jQuery}
     * @private
     */
    var _bombs_count = $('#bombs_count').val();

    /**
     * Grid object
     * @type {Grid}
     * @private
     */
    var _gridClass = new Grid(_height, _width, _bombs_count);

    /**
     * first app click
     * @type {boolean}
     * @private
     */
    var _firstClick = true;

    /**
     * timer id
     * @private
     */
    var _interval;

    /**
     * app start time (after first click)
     */
    var _time;

    /**
     * Render table content
     * @param width
     * @param height
     * @private
     */
    function _renderField(width, height) {
        gameTable.html('');
        for (var i = 0; i < height; i++) {
            var tr = $('<tr>', {
                'data-line': i
            });
            for (var j = 0; j < width; j++) {
                tr.append($('<td>', {
                    'class': 'close default',
                    'data-column': j
                    //'text' : bombs[i][j]
                }));
            }
            gameTable.append(tr);
        }
    }

    /**
     *
     */
    this.start = function () {
        var self = this;
        _renderField(_width, _height);

        // set game header
        $('.game-header').width(gameTable.width());
        $('#game-bombs').css('marginLeft', gameTable.width() - 51);
        $('#smile_button').css('marginLeft',(gameTable.width()/2) - 52);
        $('.timers').attr('data-number', 0);
        //end set game header
        smileButton.removeClass('fail win');
        _bombCounter();

        _gridClass = new Grid(_height, _width, _bombs_count);
        _gridClass.init();

        //clearInterval(_interval);
        gameTable.off('click contextmenu mousedown');
        gameTable.on('click', 'td.close.default', function () {
            if (_firstClick) {
                _time = Date.now();
                _interval = setInterval(_timer, 1000);
                _firstClick = false;
            }
            var l = $(this).parent().data('line');
            var c = $(this).data('column');
            self.open(l, c);
        });

        gameTable.on('contextmenu', 'td.close', function (e) {
            e.preventDefault();
            if ($(this).hasClass('question')) {
                $(this).removeClass('question');
            }else{
                if ($(this).hasClass('default')) {
                    if(_bombs_count > 0){
                        $(this).removeClass('default');
                        $(this).addClass('flag');
                        _bombCounter('reduce');
                    }
                } else {
                    $(this).removeClass('flag');
                    $(this).addClass('default');
                    $(this).addClass('question');
                    _bombCounter('add');
                }
            }

        });

        gameTable.on('mousedown', 'td.close', function (e) {
            if(e.which == 1){
                smileButton.addClass('hover');
            }else{

            }
        });


        $('body').on('mouseup', function (e) {
            if(e.which == 1) {
                smileButton.removeClass('hover')
            };
        });

    };

    /**
     *
     * @param l
     * @param c
     * @returns {boolean}
     */
    this.open = function (l, c) {
        var self = this;
        getCell(l, c).removeClass('close');
        getCell(l, c).removeClass('question');
        getCell(l, c).removeClass('default');
        getCell(l, c).addClass('open');
        if (_gridClass.getVal(l, c) < 9 && _gridClass.getVal(l, c) > 0) {
            getCell(l, c).addClass('open-' + _gridClass.getVal(l, c));
        } else if (_gridClass.getVal(l, c) == 9) {
            getCell(l, c).addClass('bomb');
            _fail(self);
            return false;
        } else if (_gridClass.getVal(l, c) == 0) {
            var ls = [l - 1, l, l + 1];
            var cs = [c - 1, c, c + 1];
            $.each(ls, function (index, nl) {
                if (nl >= 0 && nl < _height) {
                    $.each(cs, function (index2, ns) {
                        if (ns >= 0 && ns < _width) {
                            if (!getCell(nl, ns).hasClass('open')) {
                                self.open(nl, ns);
                            }
                        }
                    });
                }
            });
        }
        if (gameTable.find('td.close').length <= _gridClass.getBombCount() ) {
            _win(self);
        }

    };


    /**
     *
     * @private
     */
    function _timer() {

        var gameTimer = $('#game-timer');
        var currentTime = Date.now();
        var time = Math.floor((currentTime - _time) / 1000);
        var first = 0;
        var second = 0;
        var third = 0;

        if (time < 999) {
            time++;
            time = String(time);
            if (time.length == 3) {
                first = time[0];
                second = time[1];
                third = time[2];
            } else if (time.length == 2) {
                second = time[0];
                third = time[1];
            } else {
                third = time[0];
            }
            gameTimer.find('.timers').eq(0).attr('data-number', first);
            gameTimer.find('.timers').eq(1).attr('data-number', second);
            gameTimer.find('.timers').eq(2).attr('data-number', third);
        }
    }

    /**
     *
     * @param type
     * @private
     */
    function _bombCounter(type) {
        type = type || false;
        var gameBombs = $('#game-bombs');
        if (type == 'add') {
            _bombs_count++;
        } else if (type == 'reduce') {
            _bombs_count--;
        }
        var first = 0;
        var second = 0;
        var third = 0;
        var bombs = String(_bombs_count);
        if (bombs.length == 3) {
            first = bombs[0];
            second = bombs[1];
            third = bombs[2];
        } else if (bombs.length == 2) {
            second = bombs[0];
            third = bombs[1];
        } else {
            third = bombs[0];
        }
        gameBombs.find('div').eq(0).attr('data-number', first);
        gameBombs.find('div').eq(1).attr('data-number', second);
        gameBombs.find('div').eq(2).attr('data-number', third);
    }

    /**
     * When game over
     */
    function _fail(self) {
        self.stop();
        smileButton.addClass('fail');
        var bombs = _gridClass.getBombs();
        for (var i = 0; i < _gridClass.getBombCount(); i++) {
            var l = bombs[i][0];
            var c = bombs[i][1];
            if (!getCell(l, c).hasClass('open')) {
                getCell(l, c).removeClass('close');
                getCell(l, c).removeClass('default');
                //getCell(l, c).addClass('open');
                getCell(l, c).addClass('bomb');
            }
        }
        var flags = gameTable.find('td.flag');
        $.each(flags, function(index, item){
            var l = $(item).parent().data('line');
            var c = $(item).data('column');
            if(_gridClass.getVal(l, c) != 9){
                $(item).addClass('wrong-flag');
            }
        });

    };

    /**
     *
     * @private
     */
    function _win(self) {
        self.stop();
        smileButton.addClass('win');
        alert('You win!');
    }


    /**
     *
     */
     this.stop = function(){
        clearInterval(_interval);
        smileButton.removeClass('win fail hover');
        gameTable.off('click contextmenu mousedown');
        gameTable.on('click', function (e) {
            e.preventDefault();
        });

        gameTable.on('contextmenu', function (e) {
            e.preventDefault();

        });
    }

}


$(function () {

    var game = new Game();
    game.start();

    $('#setting_button').on('click', function () {
        $('.modal').toggle();
    });

    $('#apply_settings').on('click', function () {
        game.stop();
        game = new Game();
        game.start();
        $('.modal').hide();
    });

    smileButton.on('click', function () {
        game.stop();
        game = new Game();
        game.start();
    });

    $('.field-setting').on('click', function () {
        var width;
        var height;
        var bombs_count;
        switch ($(this).val()) {
            case 'novice':
                width = 9;
                height = 9;
                bombs_count = 10;
                break;
            case 'middle':
                width = 16;
                height = 16;
                bombs_count = 40;
                break;
            case 'adept':
                width = 30;
                height = 16;
                bombs_count = 99;
                break;
        }
        $('#width').val(width);
        $('#height').val(height);
        $('#bombs_count').val(bombs_count);

    });


    //console.log(setBombs());

});