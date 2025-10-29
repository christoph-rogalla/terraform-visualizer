"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
class HtmlGenerator {
    generateHtmlFrom(changes) {
        console.log(changes[1].change);
        console.log("Generating HTML...");
        handlebars_1.default.registerHelper("json", (context) => JSON.stringify(context, null, 2));
        handlebars_1.default.registerHelper("eq", (a, b) => a === b);
        handlebars_1.default.registerHelper('eq', function (a, b) {
            return a === b;
        });
        handlebars_1.default.registerHelper('ne', function (a, b) {
            return a !== b;
        });
        handlebars_1.default.registerHelper('gt', function (a, b) {
            return a > b;
        });
        handlebars_1.default.registerHelper('lt', function (a, b) {
            return a < b;
        });
        handlebars_1.default.registerHelper('gte', function (a, b) {
            return a >= b;
        });
        handlebars_1.default.registerHelper('lte', function (a, b) {
            return a <= b;
        });
        handlebars_1.default.registerHelper('and', function () {
            return Array.prototype.every.call(arguments, Boolean);
        });
        handlebars_1.default.registerHelper('or', function () {
            // Handlebars passes an extra options argument as the last parameter
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        });
        handlebars_1.default.registerHelper('not', function (value) {
            return !value;
        });
        handlebars_1.default.registerHelper('groupByAction', function (changes) {
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
            // Ensure "read" appears even if empty, for consistent grouping
            ['create', 'update', 'delete', 'read'].forEach(k => {
                if (!grouped[k])
                    grouped[k] = [];
            });
            return grouped;
        });
        handlebars_1.default.registerHelper('diffHighlight', function (before, after, mode) {
            // Quick exit
            if (before === undefined && after === undefined) {
                return new handlebars_1.default.SafeString('<pre><em>No data</em></pre>');
            }
            // Normalize input: keep primitives as-is, convert non-objects to objects for JSON.parse-safe inputs
            let beforeObj = before;
            let afterObj = after;
            try {
                // If before/after are strings that look like JSON, try to parse them; otherwise keep original.
                if (typeof before === 'string') {
                    try {
                        beforeObj = JSON.parse(before);
                    }
                    catch {
                        beforeObj = before;
                    }
                }
                if (typeof after === 'string') {
                    try {
                        afterObj = JSON.parse(after);
                    }
                    catch {
                        afterObj = after;
                    }
                }
            }
            catch (e) {
                // fallback: stringify
            }
            // Helper: determine if value is a plain object
            function isPlainObject(v) {
                return v !== null && typeof v === 'object' && !Array.isArray(v);
            }
            // Collect added/removed/changed paths (full path strings like "tags.env")
            function diffKeys(b, a, path = '') {
                const result = { added: [], removed: [], changed: [] };
                // If both are not objects (primitives or arrays), handle direct comparison at this path
                if (!isPlainObject(b) && !isPlainObject(a)) {
                    // Arrays are treated by JSON.stringify comparison
                    if (JSON.stringify(b) !== JSON.stringify(a)) {
                        if (b === undefined)
                            result.added.push(path || '__root__');
                        else if (a === undefined)
                            result.removed.push(path || '__root__');
                        else
                            result.changed.push(path || '__root__');
                    }
                    return result;
                }
                // Build union of keys when either side is an object
                const keys = new Set([
                    ...(isPlainObject(b) ? Object.keys(b) : []),
                    ...(isPlainObject(a) ? Object.keys(a) : [])
                ]);
                for (const key of keys) {
                    const fullPath = path ? `${path}.${key}` : key;
                    const bv = isPlainObject(b) ? b[key] : (Array.isArray(b) ? b[Number.parseInt(key)] : undefined);
                    const av = isPlainObject(a) ? a[key] : (Array.isArray(a) ? a[Number.parseInt(key)] : undefined);
                    // If both are plain objects => recurse
                    if (isPlainObject(bv) && isPlainObject(av)) {
                        const nested = diffKeys(bv, av, fullPath);
                        result.added.push(...nested.added);
                        result.removed.push(...nested.removed);
                        result.changed.push(...nested.changed);
                        continue;
                    }
                    // Compare arrays and primitives by JSON stringification
                    const bvStr = bv === undefined ? undefined : JSON.stringify(bv);
                    const avStr = av === undefined ? undefined : JSON.stringify(av);
                    if (bv === undefined && av !== undefined) {
                        result.added.push(fullPath);
                    }
                    else if (bv !== undefined && av === undefined) {
                        result.removed.push(fullPath);
                    }
                    else if (bvStr !== avStr) {
                        result.changed.push(fullPath);
                    }
                }
                return result;
            }
            const changes = diffKeys(beforeObj, afterObj);
            // Renderable helpers
            function escapeHtml(s) {
                return String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }
            // Render a value (primitives, arrays, objects)
            function renderValue(val, currentPath) {
                if (val === null)
                    return 'null';
                if (val === undefined)
                    return 'undefined';
                if (typeof val === 'string')
                    return `"${escapeHtml(val)}"`;
                if (typeof val === 'number' || typeof val === 'boolean')
                    return String(val);
                if (Array.isArray(val)) {
                    const items = val.map((item, idx) => renderValue(item, `${currentPath}[${idx}]`));
                    return `[${items.length ? '<br>' + items.join(',<br>') + '<br>' : ''}]`;
                }
                if (isPlainObject(val)) {
                    return renderObject(val, currentPath);
                }
                // fallback
                return escapeHtml(JSON.stringify(val));
            }
            // Render object; when mode === 'after' we show union of keys (so removed keys from before appear)
            function renderObject(obj, path = '') {
                // Determine keys to iterate:
                let keys = Object.keys(obj || {});
                if (mode === 'after') {
                    // include keys from both before and after for context (so removed keys show up)
                    const beforeKeys = isPlainObject(beforeObj) ? Object.keys(beforeObj) : [];
                    const afterKeys = isPlainObject(afterObj) ? Object.keys(afterObj) : [];
                    const union = new Set([...beforeKeys, ...afterKeys]);
                    // Order: after keys first (preserve order from obj), then any extra before-only keys
                    keys = Array.from(afterKeys).concat(Array.from([...union].filter(k => !afterKeys.includes(k))));
                }
                const rendered = keys.map(k => {
                    const fullPath = path ? `${path}.${k}` : k;
                    const inBefore = (() => {
                        try {
                            if (!isPlainObject(beforeObj))
                                return false;
                            // navigate nested beforeObj
                            const parts = fullPath.split('.');
                            let cur = beforeObj;
                            for (const p of parts) {
                                if (!isPlainObject(cur) && !Array.isArray(cur))
                                    return false;
                                cur = cur[p];
                                if (cur === undefined)
                                    return false;
                            }
                            return true;
                        }
                        catch {
                            return false;
                        }
                    })();
                    const inAfter = (() => {
                        try {
                            if (!isPlainObject(afterObj))
                                return false;
                            const parts = fullPath.split('.');
                            let cur = afterObj;
                            for (const p of parts) {
                                if (!isPlainObject(cur) && !Array.isArray(cur))
                                    return false;
                                cur = cur[p];
                                if (cur === undefined)
                                    return false;
                            }
                            return true;
                        }
                        catch {
                            return false;
                        }
                    })();
                    const isAdded = changes.added.includes(fullPath);
                    const isRemoved = changes.removed.includes(fullPath);
                    const isChanged = changes.changed.includes(fullPath);
                    // prefer the after value for rendering keys present in after
                    const renderTarget = inAfter ? getAtPath(afterObj, fullPath) : (inBefore ? getAtPath(beforeObj, fullPath) : undefined);
                    const valueHtml = renderValue(renderTarget, fullPath);
                    const keyHtml = `"${escapeHtml(k)}": `;
                    if (mode === 'after') {
                        if (isAdded || isChanged) {
                            return `<span class="diff-added font-bold text-green-700">${keyHtml}${valueHtml}</span>`;
                        }
                        if (isRemoved) {
                            // show removed value from before with strike-through
                            const removedVal = getAtPath(beforeObj, fullPath);
                            const removedHtml = escapeHtml(JSON.stringify(removedVal));
                            return `<span class="diff-removed line-through text-red-600 opacity-80">${keyHtml}${removedHtml}</span>`;
                        }
                        // unchanged -> normal text
                        return `${keyHtml}${valueHtml}`;
                    }
                    else {
                        // before mode -> plain
                        return `${keyHtml}${valueHtml}`;
                    }
                });
                return `{${rendered.length ? '<br>' + rendered.join(',<br>') + '<br>' : ''}}`;
            }
            // Safe getter for nested path like "a.b.c"
            function getAtPath(obj, path) {
                if (path === '' || obj === undefined)
                    return obj;
                const parts = path.split('.');
                let cur = obj;
                for (const p of parts) {
                    if (cur === undefined || cur === null)
                        return undefined;
                    cur = cur[p];
                }
                return cur;
            }
            // Top-level rendering: handle primitives and objects
            let outputHtml;
            if (mode === 'before') {
                // show before as plain
                if (isPlainObject(beforeObj)) {
                    outputHtml = `<pre class="before-diff">${renderObject(beforeObj)}</pre>`;
                }
                else {
                    outputHtml = `<pre class="before-diff">${escapeHtml(JSON.stringify(beforeObj, null, 2))}</pre>`;
                }
            }
            else {
                // after mode: we need to render union and include removed keys
                if (isPlainObject(afterObj) || isPlainObject(beforeObj)) {
                    // Build a synthetic object to pass to renderer: prefer afterObj but renderer will pick union keys
                    const base = isPlainObject(afterObj) ? afterObj : {};
                    outputHtml = `<pre class="after-diff">${renderObject(base)}</pre>`;
                }
                else {
                    // both primitives/arrays
                    if (JSON.stringify(beforeObj) !== JSON.stringify(afterObj)) {
                        // Mark changed primitive: show before -> after inline
                        const beforeEsc = escapeHtml(JSON.stringify(beforeObj));
                        const afterEsc = escapeHtml(JSON.stringify(afterObj));
                        outputHtml = `<pre class="after-diff"><span class="diff-removed line-through text-red-600 opacity-80">${beforeEsc}</span> → <span class="diff-added font-bold text-green-700">${afterEsc}</span></pre>`;
                    }
                    else {
                        outputHtml = `<pre class="after-diff">${escapeHtml(JSON.stringify(afterObj, null, 2))}</pre>`;
                    }
                }
            }
            return new handlebars_1.default.SafeString(outputHtml);
        });
        const template = fs_1.default.readFileSync("templates/template.hbs", "utf8");
        let compiledTemplate = handlebars_1.default.compile(template);
        return compiledTemplate({ changes });
    }
}
exports.default = HtmlGenerator;
