import handlebars from "handlebars";

export function registerLogicFunctions() {
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
  handlebars.registerHelper('eq', (a, b) => a === b);
}

function registerNotEquals() {
  handlebars.registerHelper('ne', (a, b) => a !== b);
}

function registerGreaterThen() {
  handlebars.registerHelper('gt', (a, b) => a > b);
}

function registerLowerThen() {
  handlebars.registerHelper('lt', (a, b) => a < b);
}

function registerGreaterThenEquals() {
  handlebars.registerHelper('gte', (a, b) => a >= b);
}

function registerLowerThenEquals() {
  handlebars.registerHelper('lte', (a, b) => a <= b);
}

function registerAnd() {
  handlebars.registerHelper('and', () => Array.prototype.slice.call(arguments, 0, -1).every(Boolean));
}

function registerOr() {
  handlebars.registerHelper('or', () => Array.prototype.slice.call(arguments, 0, -1).some(Boolean));
}

function registerNot() {
  handlebars.registerHelper('not', (value) => !value);
}