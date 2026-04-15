"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVisualisationFunctions = registerVisualisationFunctions;
const handlebars_1 = __importDefault(require("handlebars"));
const DiffBuilder_1 = require("../services/DiffBuilder");
function registerVisualisationFunctions() {
    registerGroupByAction();
    registerRendersChanges();
    registerTruncate();
}
function registerGroupByAction() {
    handlebars_1.default.registerHelper('groupByAction', (changes) => {
        const grouped = {};
        changes.forEach(change => {
            const actions = change.change.actions || [];
            actions.forEach(action => {
                const key = action.toLowerCase();
                if (!grouped[key])
                    grouped[key] = [];
                grouped[key].push(change);
            });
        });
        ['create', 'update', 'delete', 'read'].forEach(k => {
            if (!grouped[k])
                grouped[k] = [];
        });
        return grouped;
    });
}
function registerRendersChanges() {
    handlebars_1.default.registerHelper("renderBefore", (before, after, beforeSensitive, afterSensitive) => {
        return new handlebars_1.default.SafeString(renderSide(before, after, beforeSensitive, afterSensitive, "before"));
    });
    handlebars_1.default.registerHelper("renderAfter", (before, after, beforeSensitive, afterSensitive) => {
        return new handlebars_1.default.SafeString(renderSide(after, before, afterSensitive, beforeSensitive, "after"));
    });
}
function registerTruncate() {
    handlebars_1.default.registerHelper("truncate", (str, len) => {
        if (!str)
            return "";
        return str.length > len ? str.slice(0, len) + "…" : str;
    });
}
function maskSensitive(data, sensitiveMap) {
    if (sensitiveMap === true)
        return '***';
    if (!data || typeof data !== 'object')
        return data;
    if (Array.isArray(data)) {
        return data.map((item, i) => maskSensitive(item, sensitiveMap?.[i] ?? false));
    }
    const result = {};
    for (const key of Object.keys(data)) {
        const isSensitive = typeof sensitiveMap === 'object' &&
            sensitiveMap !== null &&
            sensitiveMap[key] === true;
        result[key] = isSensitive
            ? '***'
            : maskSensitive(data[key], sensitiveMap?.[key]);
    }
    return result;
}
// maybe as builder pattern
function renderSide(main, other, mainSensitive, otherSensitive, mainIs) {
    return new DiffBuilder_1.DiffBuilder()
        .setMain(main, mainSensitive)
        .setSide(other, otherSensitive)
        .setCurrentSide(mainIs)
        .render();
}
