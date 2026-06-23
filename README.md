# KPI Card (Actual / Comparison / Delta)

Custom Power BI vizuál – KPI karta s hlavní hodnotou, až 4 porovnáními,
deltou (absolutní + %) a trendovou šipkou s volitelným směrem „good/bad".

## Výsledný soubor

`dist/kpiCard6B1F4E2A9C8D4F0EB3A7C5D9E1F20384.1.0.0.0.pbiviz`

## Import do Power BI Desktop

1. Power BI Desktop → panel **Vizualizace** → **…** (Více vizuálů) → **Importovat vizuál ze souboru**.
2. Vyber soubor `*.pbiviz` ze složky `dist/`.
3. Klikni na novou ikonu vizuálu a naplň datová pole.

> Pro testování bez schválení tenantu zapni v Power BI Service / Desktop
> **Developer mode** není nutný – import ze souboru funguje rovnou.

## Datová pole

| Pole         | Typ      | Popis                                              |
|--------------|----------|----------------------------------------------------|
| **Actual**   | míra (1) | Hlavní hodnota zobrazená velkým písmem.            |
| **Comparison** | míra (max 4) | Hodnoty k porovnání (LY, Plán, Cíl…). Každá = jeden řádek s deltou. |

Delta se počítá jako `Actual − Comparison`, procento jako `delta / |Comparison|`.

## Formátování (Format pane)

- **Title** – zobrazit/skrýt, vlastní text (jinak název míry Actual), barva, velikost.
- **Actual value** – barva, velikost, jednotky (K/M/…), desetinná místa.
- **Comparison rows** – barva popisku, velikost, zobrazit hodnotu / %, desetinná místa.
- **Trend & colors**
  - **Higher is better** – přepínač, zda je kladná delta dobrá (zelená) nebo špatná.
    Vypni u nákladů, reklamací apod.
  - **Show trend arrow**, **Colorize delta text**
  - **Good / Bad / Neutral color**

## Vývoj / úpravy

```powershell
npm install
npx pbiviz package        # vytvoří dist/*.pbiviz
npx pbiviz start          # live náhled (vyžaduje PowerShell Core 'pwsh' pro HTTPS cert)
```

> Pozn.: `pbiviz start` (živý dev server) potřebuje k vygenerování certifikátu
> `pwsh` (PowerShell 7+). Pro pouhé `pbiviz package` to potřeba není.
