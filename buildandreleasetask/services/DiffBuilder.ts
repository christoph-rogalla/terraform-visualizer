export class EntityDifferenceBuilder {
  mainEntities: any;
  mainSensitive: any;
  sideEntities: any;
  sideSensitive: any;
  mainIs: "after" | "before" | "not-set" = "not-set";

  setMain(entities: any, sensitive: any) {
    this.mainEntities = entities;
    this.mainSensitive = sensitive;
    return this;
  }

  setSide(entities: any, sensitive: any) {
    this.sideEntities = entities;
    this.sideSensitive = sensitive;
    return this;
  }

  setCurrentSide(side: "after" | "before") {
    this.mainIs = side;
    return this;
  }

  renderAsHtml() {
    if (this.mainEntities === null && this.mainIs === "after") return '<span class="added">— deleted —</span>';
    if (this.mainEntities === null && this.mainIs === "before") return '<span class="removed">— created —</span>';

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

      if (!inMain) return [];

      return this.renderValue(key, mainVal, "line");
    });

    return lines.join("<br />");
  }

  private maskSensitive(data: any, sensitiveMap: any): any {
    if (sensitiveMap === true) return '***';
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item, i) =>
        this.maskSensitive(item, sensitiveMap?.[i] ?? false)
      );
    }

    const result: any = {};
    for (const key of Object.keys(data)) {
      const isSensitive =
        typeof sensitiveMap === 'object' &&
        sensitiveMap !== null &&
        sensitiveMap[key] === true;

      result[key] = isSensitive
        ? '***'
        : this.maskSensitive(data[key], sensitiveMap?.[key]);
    }
    return result;
  }

  private renderValue(key: string, value: any, baseClass = "line") {
    const json = JSON.stringify(value, null, 2);

    if (json === undefined) return [`<span class="${baseClass}">"${key}": undefined</span>`];

    const lines = json.split("\n");

    return lines.map((line, i) => {
      return i === 0 ?
        `<span class="${baseClass}">"${key}": ${line}</span>` :
        `<span class="${baseClass}">${line}</span>`;
    });
  }
}