/*
 * scapp - sample calculator app.
 * Andreas Nagy, 2015.
 *
 * Main calculator application. Needs the base html structure (scapp.html) to be loaded first.
 */

// global namespace
var SCAPP = SCAPP || {};

/*
 * Globals
 */

// global constants
SCAPP.constants = SCAPP.constants || {};
// button types for button click
SCAPP.constants.buttonTypes = {
    ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9,
    ADD: 10, SUBSTRACT: 11, MULTIPLY: 12, DIVIDE: 13, EXPONENTIATE: 14,
    POINT: 15, INVERT: 16, SOLVE: 17, CLEAR: 18
};
// states for state machine
SCAPP.constants.states = {
    INIT: 0,
    OPERAND1: 1,
    OPERAND1_DECIMAL: 2,
    OPERATOR: 3,
    OPERAND2: 4,
    OPERAND2_DECIMAL: 5
};

// global functions
SCAPP.functions = SCAPP.functions || {};
SCAPP.functions.className2ButtonType = function (classNames) {
    // replace scapp-button-top and scapp-button-edge class with empty string
    // search for class name without "scapp-button-" to extract the buttonType
    var arr = classNames.replace(/(scapp\-button\-top|scapp\-button\-edge)/, "").match(/scapp\-button\-(.+?)(\s|$)/);
    if (arr.length > 1) {
        return SCAPP.constants.buttonTypes[arr[1].toUpperCase()];
    }
};
SCAPP.functions.createClickHandler = function (handler, arg) {
    // wrap argument as function value, to remember it's temporary value
    return function () {
        handler.buttonClick(arg);
    };
};

/*
 * Calculator object definition
 */

// calculator constructor
SCAPP.calculator = function (rootId) {
    var self = this;

    // all object variables
    self.rootId;
    self.rootElement;
    self.displayElement;
    self.state;
    self.operand1;
    self.decimalPoint1;
    self.operand2;
    self.decimalPoint2;
    self.operator;
    self.result;

    // getting the root element
    self.rootId = rootId;
    self.rootElement = document.getElementById(self.rootId);

    // initializing the state machine (model)
    self.resetStateMachine();

    // if rootElement exists -> initialize buttons and screen (view)
    if (self.rootElement) {
        // search for display element
        var allElements = self.rootElement.getElementsByTagName("*");
        for (var i = 0; i < allElements.length; i++) {
            if ((allElements[i].className).indexOf("scapp-result-text") !== -1) {
                self.displayElement = allElements[i];
                break;
            }
        }

        // add button clicklistener to all buttons
        var buttons = self.rootElement.getElementsByTagName("button");
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var buttonType = SCAPP.functions.className2ButtonType(button.className);
            button.onclick = SCAPP.functions.createClickHandler(self, buttonType);
        }
        self.renderDisplay();
    }
};

// resets the state machine for initial input und resets all memory
SCAPP.calculator.prototype.resetStateMachine = function () {
    var self = this;

    // reset state
    self.state = SCAPP.constants.states.INIT;

    // operand 1
    // the first number typed by the user -> always displayed toFixed()
    self.operand1 = null;
    // the next decimal point of the first operand when typing in point mode
    self.decimalPoint1 = 1;
    // operand 2
    // the second number typed by the user -> always displayed toFixed()
    self.operand2 = null;
    // the next decimal point of the second operand when typing in point mode
    self.decimalPoint2 = 1;
    // operator for the next operation
    self.operator = null;
    // result
    // after the first solution this acts like operand 1
    self.result = null;
};

// Method for button clicks.
// Switches through all types of buttons and performs the action.
// Works like a state machine in subject to the state of operand1, operator and operand2.
// When operator is set it is operand1's turn, otherwise operand2
SCAPP.calculator.prototype.buttonClick = function (buttonType) {
    var self = this;
    var buttonTypes = SCAPP.constants.buttonTypes;
    var states = SCAPP.constants.states;

    if (typeof buttonType === "number") {

        switch (self.state) {
            case states.INIT:
                // Initial state, start with the first number
                switch (buttonType) {
                    case buttonTypes.ZERO:
                    case buttonTypes.ONE:
                    case buttonTypes.TWO:
                    case buttonTypes.THREE:
                    case buttonTypes.FOUR:
                    case buttonTypes.FIVE:
                    case buttonTypes.SIX:
                    case buttonTypes.SEVEN:
                    case buttonTypes.EIGHT:
                    case buttonTypes.NINE:
                        self.operand1 = buttonType;
                        self.state = states.OPERAND1;
                        break;
                    case buttonTypes.POINT:
                        self.operand1 = 0;
                        self.decimalPoint1 = 1;
                        self.state = states.OPERAND1_DECIMAL;
                        break;

                    case buttonTypes.CLEAR:
                        self.resetStateMachine();
                        break;
                }
                break;

            case states.OPERAND1:
                // Waiting for operand 1 to be defined
                switch (buttonType) {
                    case buttonTypes.ZERO:
                    case buttonTypes.ONE:
                    case buttonTypes.TWO:
                    case buttonTypes.THREE:
                    case buttonTypes.FOUR:
                    case buttonTypes.FIVE:
                    case buttonTypes.SIX:
                    case buttonTypes.SEVEN:
                    case buttonTypes.EIGHT:
                    case buttonTypes.NINE:
                        if (self.operand1 !== null) {
                            self.operand1 *= 10;
                        }
                        self.operand1 += buttonType;
                        self.result = null;
                        break;
                    case buttonTypes.POINT:
                        self.operand1 += 0;
                        self.decimalPoint1 = 1;
                        self.state = states.OPERAND1_DECIMAL;
                        self.result = null;
                        break;
                    case buttonTypes.INVERT:
                        if (self.operand1 !== null) {
                            self.operand1 *= -1;
                        } else {
                            self.result *= -1;
                        }
                        break;
                    case buttonTypes.ADD:
                    case buttonTypes.SUBSTRACT:
                    case buttonTypes.MULTIPLY:
                    case buttonTypes.DIVIDE:
                    case buttonTypes.EXPONENTIATE:
                        self.operand2 = null;
                        self.operator = buttonType;
                        self.state = states.OPERATOR;
                        break;

                    case buttonTypes.SOLVE:
                        // has to solve operand1/result with operand2 (if operator an operand2 exists)
                        // has to go to operand1 state, clear the typed operand1 and leave operator and operand2
                        var operand1 = self.operand1 || self.result;
                        if (self.operator !== null && self.operand2 !== null) {
                            self.result = self.calc(operand1, self.operator, self.operand2);
                            self.operand1 = null;
                        }
                        // still in operand1 state
                        break;
                    case buttonTypes.CLEAR:
                        self.resetStateMachine();
                        break;
                }
                break;

            case states.OPERAND1_DECIMAL:
                // Waiting for operand 1 decimals to be defined
                switch (buttonType) {
                    case buttonTypes.ZERO:
                    case buttonTypes.ONE:
                    case buttonTypes.TWO:
                    case buttonTypes.THREE:
                    case buttonTypes.FOUR:
                    case buttonTypes.FIVE:
                    case buttonTypes.SIX:
                    case buttonTypes.SEVEN:
                    case buttonTypes.EIGHT:
                    case buttonTypes.NINE:
                        self.operand1 += (buttonType / Math.pow(10, self.decimalPoint1));
                        self.decimalPoint1++;
                        break;
                    case buttonTypes.INVERT:
                        self.operand1 *= -1;
                        break;
                    case buttonTypes.ADD:
                    case buttonTypes.SUBSTRACT:
                    case buttonTypes.MULTIPLY:
                    case buttonTypes.DIVIDE:
                    case buttonTypes.EXPONENTIATE:
                        self.operand2 = null;
                        self.operator = buttonType;
                        self.state = states.OPERATOR;
                        break;

                    case buttonTypes.SOLVE:
                        // has to solve operand1/result with operand2 (if operator an operand2 exists)
                        // has to go to operand1 state, clear the typed operand1 and leave operator and operand2
                        if (self.operator !== null && self.operand2 !== null) {
                            self.result = self.calc(self.operand1, self.operator, self.operand2);
                            self.operand1 = null;
                        } else {
                            self.result = self.operand1;
                            self.operand1 = null;
                        }
                        self.state = states.OPERAND1;
                        break;
                    case buttonTypes.CLEAR:
                        self.resetStateMachine();
                        break;
                }
                break;

            case states.OPERATOR:
                // operator chosen, start with the second number
                switch (buttonType) {
                    case buttonTypes.ZERO:
                    case buttonTypes.ONE:
                    case buttonTypes.TWO:
                    case buttonTypes.THREE:
                    case buttonTypes.FOUR:
                    case buttonTypes.FIVE:
                    case buttonTypes.SIX:
                    case buttonTypes.SEVEN:
                    case buttonTypes.EIGHT:
                    case buttonTypes.NINE:
                        self.operand2 = buttonType;
                        self.state = states.OPERAND2;
                        break;
                    case buttonTypes.POINT:
                        self.operand2 = 0;
                        self.decimalPoint2 = 1;
                        self.state = states.OPERAND2_DECIMAL;
                        break;
                    case buttonTypes.ADD:
                    case buttonTypes.SUBSTRACT:
                    case buttonTypes.MULTIPLY:
                    case buttonTypes.DIVIDE:
                    case buttonTypes.EXPONENTIATE:
                        self.operand2 = null;
                        self.operator = buttonType;
                        break;

                    case buttonTypes.SOLVE:
                        // has to calc operand1/result with itself
                        var operand1 = self.operand1 || self.result;
                        if (self.operand2 === null) {
                            self.operand2 = operand1;
                        }
                        self.result = self.calc(operand1, self.operator, self.operand2);
                        self.operand1 = null;
                        self.state = states.OPERAND1;
                        break;
                    case buttonTypes.CLEAR:
                        self.resetStateMachine();
                        break;
                }
                break;

            case states.OPERAND2:
                // Waiting for operand 2 to be defined
                switch (buttonType) {
                    case buttonTypes.ZERO:
                    case buttonTypes.ONE:
                    case buttonTypes.TWO:
                    case buttonTypes.THREE:
                    case buttonTypes.FOUR:
                    case buttonTypes.FIVE:
                    case buttonTypes.SIX:
                    case buttonTypes.SEVEN:
                    case buttonTypes.EIGHT:
                    case buttonTypes.NINE:
                        self.operand2 *= 10;
                        self.operand2 += buttonType;
                        break;
                    case buttonTypes.POINT:
                        self.decimalPoint2 = 1;
                        self.state = states.OPERAND2_DECIMAL;
                        break;
                    case buttonTypes.INVERT:
                        self.operand2 *= -1;
                        break;
                    case buttonTypes.ADD:
                    case buttonTypes.SUBSTRACT:
                    case buttonTypes.MULTIPLY:
                    case buttonTypes.DIVIDE:
                    case buttonTypes.EXPONENTIATE:
                        // has to solve operand1/result with operand2
                        // has to reset operand2 and go to operator state
                        var operand1 = self.operand1 || self.result;
                        self.result = self.calc(operand1, self.operator, self.operand2);
                        self.operand1 = null;
                        self.operand2 = null;
                        self.operator = buttonType;
                        self.state = states.OPERATOR;
                        break;

                    case buttonTypes.SOLVE:
                        // has to solve operand1/result with operand2
                        // has to go to operand1 state, clear the typed operand1 and leave operator and operand2
                        var operand1 = self.operand1 || self.result;
                        self.result = self.calc(operand1, self.operator, self.operand2);
                        self.operand1 = null;
                        self.state = states.OPERAND1;
                        break;
                    case buttonTypes.CLEAR:
                        self.resetStateMachine();
                        break;
                }
                break;

            case states.OPERAND2_DECIMAL:
                // Waiting for operand 2 decimals to be defined
                switch (buttonType) {
                    case buttonTypes.ZERO:
                    case buttonTypes.ONE:
                    case buttonTypes.TWO:
                    case buttonTypes.THREE:
                    case buttonTypes.FOUR:
                    case buttonTypes.FIVE:
                    case buttonTypes.SIX:
                    case buttonTypes.SEVEN:
                    case buttonTypes.EIGHT:
                    case buttonTypes.NINE:
                        self.operand2 += (buttonType / Math.pow(10, self.decimalPoint2));
                        self.decimalPoint2++;
                        break;
                    case buttonTypes.INVERT:
                        self.operand2 *= -1;
                        break;
                    case buttonTypes.ADD:
                    case buttonTypes.SUBSTRACT:
                    case buttonTypes.MULTIPLY:
                    case buttonTypes.DIVIDE:
                    case buttonTypes.EXPONENTIATE:
                        // has to solve operand1/result with operand2
                        // has to reset operand2 and go to operator state
                        var operand1 = self.operand1 || self.result;
                        self.result = self.calc(operand1, self.operator, self.operand2);
                        self.operand1 = null;
                        self.operand2 = null;
                        self.operator = buttonType;
                        self.state = states.OPERATOR;
                        break;
                        break;

                    case buttonTypes.SOLVE:
                        // has to solve operand1/result with operand2
                        // has to go to operand1 state, clear the typed operand1 and leave operator and operand2
                        var operand1 = self.operand1 || self.result;
                        self.result = self.calc(operand1, self.operator, self.operand2);
                        self.operand1 = null;
                        self.state = states.OPERAND1;
                        break;
                    case buttonTypes.CLEAR:
                        self.resetStateMachine();
                        break;
                }
                break;
        }

        self.renderDisplay();
    }
};

// calculators core function =)
// does what it can do best -> calculate
SCAPP.calculator.prototype.calc = function (operand1, operator, operand2) {
    var self = this;
    var buttonTypes = SCAPP.constants.buttonTypes;

    switch (operator) {
        case buttonTypes.ADD:
            return operand1 + operand2;

        case buttonTypes.SUBSTRACT:
            return operand1 - operand2;

        case buttonTypes.MULTIPLY:
            return operand1 * operand2;

        case buttonTypes.DIVIDE:
            return operand1 / operand2;

        case buttonTypes.EXPONENTIATE:
            return  Math.pow(operand1, operand2);
    }
};

// Method for rendering calculator display.
// Renders in subject to the state of operand1, operator and operand2.
SCAPP.calculator.prototype.renderDisplay = function () {
    var self = this;
    var states = SCAPP.constants.states;

    var result;

    switch (self.state) {
        case states.INIT:
            result = "";
            break;

        case states.OPERAND1:
        case states.OPERAND1_DECIMAL:
        case states.OPERATOR:
            if (self.operand1 !== null) {
                result = self.operand1.toFixed(self.decimalPoint1 > 0 ? self.decimalPoint1 - 1 : 0);
                if (result.replace(".", "").length > 13) {
                    result = self.operand1.toPrecision(8);
                }
            } else {
                result = self.result;
            }
            break;

        case states.OPERAND2:
        case states.OPERAND2_DECIMAL:
            result = self.operand2.toFixed(self.decimalPoint2 > 0 ? self.decimalPoint2 - 1 : 0);
            if (result.replace(".", "").length > 13) {
                result = self.operand2.toPrecision(8);
            }
            break;
    }

    self.displayElement.innerHTML = result;
};
