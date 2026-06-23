"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import { VisualSettings } from "./settings";

import "./../style/visual.less";

import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

const SVG_NS = "http://www.w3.org/2000/svg";

interface ComparisonRow {
    label: string;
    comparisonValue: number | null;
    delta: number;
    deltaPercent: number | null;
    valid: boolean;
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private formattingSettingsService: FormattingSettingsService;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();

        this.root = document.createElement("div");
        this.root.className = "kpi-card";
        options.element.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions): void {
        const dataView: DataView = options.dataViews && options.dataViews[0];
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualSettings,
            dataView
        );

        this.root.textContent = "";

        const values = dataView?.categorical?.values;
        if (!values || values.length === 0) {
            this.renderPlaceholder("Drop a measure into “Actual”, then add up to 4 into “Comparison”.");
            return;
        }

        // Split incoming measure columns by their data role.
        let actualCol: DataViewValueColumn = null;
        const comparisonCols: DataViewValueColumn[] = [];
        for (const col of values) {
            const roles = col.source.roles || {};
            if (roles["actual"] && !actualCol) {
                actualCol = col;
            } else if (roles["comparison"]) {
                comparisonCols.push(col);
            }
        }

        if (!actualCol) {
            this.renderPlaceholder("Add a measure to the “Actual” field.");
            return;
        }

        const actualValue = this.toNumber(actualCol.values?.[0]);
        this.renderCard(actualValue, actualCol, comparisonCols);
    }

    // ---------------------------------------------------------------- render

    private renderCard(
        actualValue: number,
        actualCol: DataViewValueColumn,
        comparisonCols: DataViewValueColumn[]
    ): void {
        const s = this.settings;

        // ---- Title
        if (s.title.show.value) {
            const titleText = (s.title.titleText.value || "").trim() || actualCol.source.displayName;
            const titleEl = document.createElement("div");
            titleEl.className = "kpi-title";
            titleEl.textContent = titleText;
            titleEl.style.color = s.title.fontColor.value.value;
            titleEl.style.fontSize = `${s.title.fontSize.value}px`;
            titleEl.style.textAlign = String(s.title.alignment.value.value);
            this.applyOverflow(titleEl, String(s.title.overflow.value.value));
            titleEl.title = titleText;
            this.root.appendChild(titleEl);
        }

        // ---- Actual value
        const actualFormatter = vf.create({
            format: this.buildFormat(actualCol.source.format, s.actual.thousandsSeparator.value, s.actual.decimalPlaces.value),
            value: Number(s.actual.displayUnits.value) || 0,
            precision: s.actual.decimalPlaces.value,
            cultureSelector: this.host.locale
        });

        const actualEl = document.createElement("div");
        actualEl.className = "kpi-actual";
        actualEl.textContent = actualValue === null ? "—" : actualFormatter.format(actualValue);
        actualEl.style.color = s.actual.fontColor.value.value;
        actualEl.style.fontSize = `${s.actual.fontSize.value}px`;
        actualEl.style.textAlign = String(s.actual.alignment.value.value);
        this.root.appendChild(actualEl);

        // ---- Comparison rows
        if (comparisonCols.length === 0) {
            return;
        }

        const rowsWrap = document.createElement("div");
        rowsWrap.className = "kpi-rows";
        this.root.appendChild(rowsWrap);

        const valueFmt = vf.create({
            format: this.buildFormat(actualCol.source.format, s.comparison.thousandsSeparator.value, s.comparison.decimalPlaces.value),
            value: Number(s.actual.displayUnits.value) || 0,
            precision: s.comparison.decimalPlaces.value,
            cultureSelector: this.host.locale
        });
        const percentFmt = vf.create({
            format: "0.%",
            precision: s.comparison.percentDecimalPlaces.value,
            cultureSelector: this.host.locale
        });

        const customLabels = this.parseCustomLabels(s.comparison.customLabels.value);

        comparisonCols.forEach((col, i) => {
            const compValue = this.toNumber(col.values?.[0]);
            const label = customLabels[i] !== undefined ? customLabels[i] : col.source.displayName;
            const row = this.buildRow(actualValue, compValue, label);
            rowsWrap.appendChild(this.renderRow(row, valueFmt, percentFmt));
        });
    }

    private parseCustomLabels(raw: string): string[] {
        if (!raw) {
            return [];
        }
        return raw.split(/[;,]/).map(t => t.trim());
    }

    private buildRow(actual: number, comparison: number, label: string): ComparisonRow {
        const valid = actual !== null && comparison !== null;
        const delta = valid ? actual - comparison : 0;
        let deltaPercent: number | null = null;
        if (valid && comparison !== 0) {
            deltaPercent = delta / Math.abs(comparison);
        }
        return { label, comparisonValue: comparison, delta, deltaPercent, valid };
    }

    private renderRow(
        row: ComparisonRow,
        valueFmt: vf.IValueFormatter,
        percentFmt: vf.IValueFormatter
    ): HTMLElement {
        const s = this.settings;
        const align = String(s.comparison.alignment.value.value);
        const el = document.createElement("div");
        el.className = "kpi-row";
        el.style.fontSize = `${s.comparison.fontSize.value}px`;
        el.style.justifyContent =
            align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

        const direction = !row.valid || row.delta === 0 ? 0 : (row.delta > 0 ? 1 : -1);
        const color = this.resolveColor(direction);

        // Arrow
        if (s.trend.showArrow.value) {
            el.appendChild(this.createArrow(direction, color));
        }

        // Label
        if (s.comparison.showLabel.value && row.label) {
            const labelEl = document.createElement("span");
            labelEl.className = "kpi-row-label";
            labelEl.textContent = row.label;
            labelEl.style.color = s.comparison.fontColor.value.value;
            this.applyOverflow(labelEl, String(s.comparison.overflow.value.value));
            labelEl.title = row.label;
            el.appendChild(labelEl);
        }

        // Delta value + percent
        const metricEl = document.createElement("span");
        metricEl.className = "kpi-row-metric";
        // Pin the metric to the far right only for left alignment with a visible label;
        // otherwise keep arrow + label + metric grouped together.
        metricEl.style.marginLeft =
            align === "left" && s.comparison.showLabel.value && !!row.label ? "auto" : "8px";
        if (s.trend.colorizeValue.value) {
            metricEl.style.color = color;
        } else {
            metricEl.style.color = s.comparison.fontColor.value.value;
        }

        const showComparisonValue = s.comparison.valueMode.value.value === "actual";

        const parts: string[] = [];
        if (!row.valid) {
            parts.push("—");
        } else {
            if (s.comparison.showValue.value) {
                if (showComparisonValue) {
                    // Raw comparison figure – no +/- prefix.
                    parts.push(valueFmt.format(row.comparisonValue));
                } else {
                    parts.push(this.withSign(row.delta, valueFmt.format(row.delta)));
                }
            }
            if (s.comparison.showPercent.value && row.deltaPercent !== null) {
                parts.push(this.withSign(row.deltaPercent, percentFmt.format(row.deltaPercent)));
            }
        }
        metricEl.textContent = parts.join("  •  ");
        el.appendChild(metricEl);

        return el;
    }

    private renderPlaceholder(text: string): void {
        const el = document.createElement("div");
        el.className = "kpi-placeholder";
        el.textContent = text;
        this.root.appendChild(el);
    }

    // ---------------------------------------------------------------- helpers

    private resolveColor(direction: number): string {
        const t = this.settings.trend;
        if (direction === 0) {
            return t.neutralColor.value.value;
        }
        const positiveIsGood = t.higherIsBetter.value;
        const isGood = direction > 0 ? positiveIsGood : !positiveIsGood;
        return isGood ? t.goodColor.value.value : t.badColor.value.value;
    }

    private createArrow(direction: number, color: string): SVGElement {
        const size = 12;
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("class", "kpi-arrow");
        svg.setAttribute("width", String(size));
        svg.setAttribute("height", String(size));
        svg.setAttribute("viewBox", "0 0 12 12");

        const shape = document.createElementNS(SVG_NS, "path");
        let d: string;
        if (direction > 0) {
            d = "M6 1 L11 9 L1 9 Z";            // up triangle
        } else if (direction < 0) {
            d = "M1 3 L11 3 L6 11 Z";           // down triangle
        } else {
            d = "M1 5 H11 V7 H1 Z";             // neutral dash
        }
        shape.setAttribute("d", d);
        shape.setAttribute("fill", color);
        svg.appendChild(shape);
        return svg;
    }

    private withSign(num: number, formatted: string): string {
        // valueFormatter already prints "-" for negatives; add explicit "+" for positives.
        if (num > 0 && formatted.charAt(0) !== "+") {
            return "+" + formatted;
        }
        return formatted;
    }

    private toNumber(raw: powerbi.PrimitiveValue): number | null {
        if (raw === null || raw === undefined || raw === "") {
            return null;
        }
        const n = Number(raw);
        return isNaN(n) ? null : n;
    }

    private applyOverflow(el: HTMLElement, mode: string): void {
        switch (mode) {
            case "wrap":
                el.style.whiteSpace = "normal";
                el.style.overflow = "hidden";
                el.style.textOverflow = "clip";
                el.style.wordBreak = "break-word";
                break;
            case "clip":
                el.style.whiteSpace = "nowrap";
                el.style.overflow = "visible";
                el.style.textOverflow = "clip";
                break;
            case "ellipsis":
            default:
                el.style.whiteSpace = "nowrap";
                el.style.overflow = "hidden";
                el.style.textOverflow = "ellipsis";
                break;
        }
    }

    /**
     * Builds a numeric format string honoring the thousands-separator toggle and
     * decimal places. Percentage measures keep their native format so the % stays.
     */
    private buildFormat(sourceFormat: string, thousands: boolean, decimals: number): string {
        if (sourceFormat && sourceFormat.indexOf("%") >= 0) {
            return sourceFormat;
        }
        const intPart = thousands ? "#,0" : "0";
        const decPart = decimals > 0 ? "." + "0".repeat(decimals) : "";
        return intPart + decPart;
    }

    // ---------------------------------------------------------------- format pane

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }
}
