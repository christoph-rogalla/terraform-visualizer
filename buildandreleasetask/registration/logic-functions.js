"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogicFunctions = registerLogicFunctions;
const handlebars_1 = __importDefault(require("handlebars"));
function registerLogicFunctions() {
    registerEquals();
    registerNotEquals();
    registerGreaterThen();
    registerLowerThen();
    registerGreaterThenEquals();
    registerLowerThenEquals();
    registerAnd();
    registerOr();
    registerNot();
}
function registerEquals() {
    handlebars_1.default.registerHelper('eq', (a, b) => a === b);
}
function registerNotEquals() {
    handlebars_1.default.registerHelper('ne', (a, b) => a !== b);
}
function registerGreaterThen() {
    handlebars_1.default.registerHelper('gt', (a, b) => a > b);
}
function registerLowerThen() {
    handlebars_1.default.registerHelper('lt', (a, b) => a < b);
}
function registerGreaterThenEquals() {
    handlebars_1.default.registerHelper('gte', (a, b) => a >= b);
}
function registerLowerThenEquals() {
    handlebars_1.default.registerHelper('lte', (a, b) => a <= b);
}
function registerAnd() {
    handlebars_1.default.registerHelper('and', () => Array.prototype.slice.call(arguments, 0, -1).every(Boolean));
}
function registerOr() {
    handlebars_1.default.registerHelper('or', () => Array.prototype.slice.call(arguments, 0, -1).some(Boolean));
}
function registerNot() {
    handlebars_1.default.registerHelper('not', (value) => !value);
}
