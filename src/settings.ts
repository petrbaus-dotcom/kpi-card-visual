"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsModel = formattingSettings.Model;

const ALIGN_ITEMS = [
    { value: "left", displayName: "Left" },
    { value: "center", displayName: "Center" },
    { value: "right", displayName: "Right" }
];

const OVERFLOW_ITEMS = [
    { value: "ellipsis", displayName: "Truncate with …" },
    { value: "wrap", displayName: "Wrap to next line" },
    { value: "clip", displayName: "Show all (clip)" }
];

/**
 * Title card – the small heading at the top of the visual.
 */
class TitleCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show title",
        value: true
    });

    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Title text",
        description: "Leave empty to use the name of the Actual measure.",
        value: "",
        placeholder: "e.g. Množství práce"
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#605E5C" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 12
    });

    alignment = new formattingSettings.ItemDropdown({
        name: "alignment",
        displayName: "Alignment",
        items: ALIGN_ITEMS,
        value: ALIGN_ITEMS[0]
    });

    overflow = new formattingSettings.ItemDropdown({
        name: "overflow",
        displayName: "Long text",
        items: OVERFLOW_ITEMS,
        value: OVERFLOW_ITEMS[0]
    });

    name: string = "title";
    displayName: string = "Title";
    slices = [this.show, this.titleText, this.fontColor, this.fontSize, this.alignment, this.overflow];
}

/**
 * Actual card – formatting of the big main value.
 */
class ActualCardSettings extends FormattingSettingsCard {
    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#252423" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 36
    });

    displayUnits = new formattingSettings.AutoDropdown({
        name: "displayUnits",
        displayName: "Display units",
        value: 0
    });

    decimalPlaces = new formattingSettings.NumUpDown({
        name: "decimalPlaces",
        displayName: "Decimal places",
        value: 0
    });

    thousandsSeparator = new formattingSettings.ToggleSwitch({
        name: "thousandsSeparator",
        displayName: "Thousands separator",
        value: true
    });

    alignment = new formattingSettings.ItemDropdown({
        name: "alignment",
        displayName: "Alignment",
        items: ALIGN_ITEMS,
        value: ALIGN_ITEMS[0]
    });

    name: string = "actual";
    displayName: string = "Actual value";
    slices = [this.fontColor, this.fontSize, this.displayUnits, this.decimalPlaces, this.thousandsSeparator, this.alignment];
}

/**
 * Comparison card – formatting of the delta rows.
 */
class ComparisonCardSettings extends FormattingSettingsCard {
    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Label color",
        value: { value: "#605E5C" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 11
    });

    valueMode = new formattingSettings.ItemDropdown({
        name: "valueMode",
        displayName: "Value to show",
        description: "Comparison value = the raw comparison figure. Delta amount = the difference (Actual − Comparison).",
        items: [
            { value: "delta", displayName: "Delta amount" },
            { value: "actual", displayName: "Comparison value" }
        ],
        value: { value: "delta", displayName: "Delta amount" }
    });

    showLabel = new formattingSettings.ToggleSwitch({
        name: "showLabel",
        displayName: "Show label",
        value: true
    });

    customLabels = new formattingSettings.TextInput({
        name: "customLabels",
        displayName: "Custom label(s)",
        description: "Overrides the measure name(s). For several comparisons separate them with ; or , in field order, e.g. 'Loni; Plán; Cíl'.",
        value: "",
        placeholder: "e.g. Loni; Plán"
    });

    thousandsSeparator = new formattingSettings.ToggleSwitch({
        name: "thousandsSeparator",
        displayName: "Thousands separator",
        value: true
    });

    alignment = new formattingSettings.ItemDropdown({
        name: "alignment",
        displayName: "Row alignment",
        items: ALIGN_ITEMS,
        value: ALIGN_ITEMS[0]
    });

    overflow = new formattingSettings.ItemDropdown({
        name: "overflow",
        displayName: "Long label",
        items: OVERFLOW_ITEMS,
        value: OVERFLOW_ITEMS[0]
    });

    showValue = new formattingSettings.ToggleSwitch({
        name: "showValue",
        displayName: "Show value",
        value: true
    });

    showPercent = new formattingSettings.ToggleSwitch({
        name: "showPercent",
        displayName: "Show delta %",
        value: true
    });

    decimalPlaces = new formattingSettings.NumUpDown({
        name: "decimalPlaces",
        displayName: "Delta decimal places",
        value: 0
    });

    percentDecimalPlaces = new formattingSettings.NumUpDown({
        name: "percentDecimalPlaces",
        displayName: "Percent decimal places",
        value: 0
    });

    name: string = "comparison";
    displayName: string = "Comparison rows";
    slices = [
        this.fontColor,
        this.fontSize,
        this.valueMode,
        this.showValue,
        this.showPercent,
        this.decimalPlaces,
        this.percentDecimalPlaces,
        this.thousandsSeparator,
        this.showLabel,
        this.customLabels,
        this.alignment,
        this.overflow
    ];
}

/**
 * Trend card – arrow + good/bad coloring logic.
 */
class TrendCardSettings extends FormattingSettingsCard {
    higherIsBetter = new formattingSettings.ToggleSwitch({
        name: "higherIsBetter",
        displayName: "Higher is better",
        description: "On: a positive delta is good (green). Off: a negative delta is good (e.g. costs, complaints).",
        value: true
    });

    showArrow = new formattingSettings.ToggleSwitch({
        name: "showArrow",
        displayName: "Show trend arrow",
        value: true
    });

    colorizeValue = new formattingSettings.ToggleSwitch({
        name: "colorizeValue",
        displayName: "Colorize delta text",
        value: true
    });

    goodColor = new formattingSettings.ColorPicker({
        name: "goodColor",
        displayName: "Good color",
        value: { value: "#107C10" }
    });

    badColor = new formattingSettings.ColorPicker({
        name: "badColor",
        displayName: "Bad color",
        value: { value: "#D13438" }
    });

    neutralColor = new formattingSettings.ColorPicker({
        name: "neutralColor",
        displayName: "Neutral color",
        value: { value: "#605E5C" }
    });

    name: string = "trend";
    displayName: string = "Trend & colors";
    slices = [
        this.higherIsBetter,
        this.showArrow,
        this.colorizeValue,
        this.goodColor,
        this.badColor,
        this.neutralColor
    ];
}

/**
 * Root formatting model.
 */
export class VisualSettings extends FormattingSettingsModel {
    title = new TitleCardSettings();
    actual = new ActualCardSettings();
    comparison = new ComparisonCardSettings();
    trend = new TrendCardSettings();

    cards = [this.title, this.actual, this.comparison, this.trend];
}
