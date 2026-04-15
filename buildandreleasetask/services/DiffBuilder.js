"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffBuilder = void 0;
class DiffBuilder {
    mainEntities;
    mainSensitive;
    sideEntities;
    sideSensitive;
    mainIs = "not-set";
    setMain(entities, sensitive) {
        this.mainEntities = entities;
        this.mainSensitive = sensitive;
        return this;
    }
    setSide(entities, sensitive) {
        this.sideEntities = entities;
        this.sideSensitive = sensitive;
        return this;
    }
    setCurrentSide(side) {
        this.mainIs = side;
        return this;
    }
    render() {
        if (this.mainEntities === null && this.mainIs === "after")
            return '<span class="added">— deleted —</span>';
        if (this.mainEntities === null && this.mainIs === "before")
            return '<span class="removed">— created —</span>';
        const safeMain = this.maskSensitive(this.mainEntities || {}, this.mainSensitive || {});
        const safeSide = this.maskSensitive(this.sideEntities || {}, this.sideSensitive || {});
        const allKeys = Array.from(new Set([
            ...Object.keys(safeMain),
            ...Object.keys(safeSide)
        ]));
        const lines = allKeys.flatMap(key => {
            const inMain = key in safeMain;
            const inOther = key in safeSide;
            const mainVal = safeMain[key];
            const otherVal = safeSide[key];
            const mainJson = JSON.stringify(mainVal, null, 2);
            const otherJson = JSON.stringify(otherVal, null, 2);
            if (!inMain && this.mainIs === "after") {
                return this.renderValue(key, mainVal, "line added");
            }
            if (!inOther && this.mainIs === "before") {
                return this.renderValue(key, mainVal, "line removed");
            }
            if (inMain && inOther && mainJson !== otherJson) {
                return this.renderValue(key, mainVal, "line changed");
            }
            if (!inMain)
                return [];
            return this.renderValue(key, mainVal, "line");
        });
        return lines.join("<br />");
    }
    maskSensitive(data, sensitiveMap) {
        if (sensitiveMap === true)
            return '***';
        if (!data || typeof data !== 'object')
            return data;
        if (Array.isArray(data)) {
            return data.map((item, i) => this.maskSensitive(item, sensitiveMap?.[i] ?? false));
        }
        const result = {};
        for (const key of Object.keys(data)) {
            const isSensitive = typeof sensitiveMap === 'object' &&
                sensitiveMap !== null &&
                sensitiveMap[key] === true;
            result[key] = isSensitive
                ? '***'
                : this.maskSensitive(data[key], sensitiveMap?.[key]);
        }
        return result;
    }
    renderValue(key, value, baseClass = "line") {
        const json = JSON.stringify(value, null, 2);
        if (json === undefined)
            return [`<span class="${baseClass}">"${key}": undefined</span>`];
        const lines = json.split("\n");
        return lines.map((line, i) => {
            if (i === 0) {
                return `<span class="${baseClass}">"${key}": ${line}</span>`;
            }
            return `<span class="${baseClass}">${line}</span>`;
        });
    }
}
exports.DiffBuilder = DiffBuilder;
