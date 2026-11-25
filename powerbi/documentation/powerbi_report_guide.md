# RETURNSIGHT AI — Power BI Report Assembly & Refresh Guide

This guide provides end-to-end instructions for loading, modeling, and assembling the 4-page enterprise Power BI analytics suite for RETURNSIGHT AI.

---

## 1. Data Connection & Power Query Setup

1. Open **Microsoft Power BI Desktop**.
2. Click **Get Data** -> **Folder** or **Text/CSV**.
3. Select the folder: `powerbi/exports/` located in the project root.
4. Import all 8 CSV tables:
   - `FactOrders.csv`
   - `FactPredictions.csv`
   - `FactReturns.csv`
   - `FactReturnCosts.csv`
   - `DimCustomer.csv`
   - `DimDate.csv`
   - `DimCategory.csv`
   - `DimShipping.csv`
   - `DimPayment.csv`
5. In Power Query Editor:
   - Verify that header rows are promoted.
   - Set `DateKey` in `DimDate` and `FactOrders` as Whole Number.
   - Set `FullDate` in `DimDate` as Date.
   - Click **Close & Apply**.

---

## 2. Relationships Configuration

Navigate to **Model View** and establish the star schema relationships:
- Connect `FactOrders[DateKey]` -> `DimDate[DateKey]` (*:1)
- Connect `FactOrders[CustomerID]` -> `DimCustomer[CustomerID]` (*:1)
- Connect `FactOrders[CategoryID]` -> `DimCategory[CategoryID]` (*:1)
- Connect `FactOrders[ShippingID]` -> `DimShipping[ShippingID]` (*:1)
- Connect `FactOrders[PaymentID]` -> `DimPayment[PaymentID]` (*:1)
- Connect `FactOrders[OrderID]` -> `FactPredictions[OrderID]` (1:1, Cross-filter: Both)
- Connect `FactOrders[OrderID]` -> `FactReturns[OrderID]` (1:1, Cross-filter: Both)
- Connect `FactOrders[OrderID]` -> `FactReturnCosts[OrderID]` (1:1, Cross-filter: Both)

---

## 3. Creating DAX Measures

Create a dedicated measure table `_Measures`:
1. In Home ribbon -> **Enter Data** -> Name table `_Measures`.
2. Open `powerbi/dax/measures.dax` and create the measures:
   - `Total Orders`
   - `Actual Returns`
   - `Actual Return Rate` (Format as Percentage, 2 decimals)
   - `Total Order Revenue` (Format as Currency \$)
   - `Revenue Affected by Returns` (Format as Currency \$)
   - `Average Return Probability` (Format as Percentage, 1 decimal)
   - `Predicted Returns`
   - `High Risk Orders`
   - `Total Return Cost` (Format as Currency \$)
   - `Total Profit Loss` (Format as Currency \$)
   - `Projected Cost Savings (20% Mitigation)` (Format as Currency \$)
   - `Total CO2 Emissions (kg)`
   - `Total Packaging Waste (kg)`

---

## 4. Four-Page Enterprise Report Layout

### Page 1 — Executive Business Overview
- **Header**: RETURNSIGHT AI — Executive Overview (Navy / Slate aesthetic)
- **Top KPI Cards**:
  1. `Total Orders` (e.g. 12,000)
  2. `Actual Returns` (e.g. 3,270)
  3. `Actual Return Rate` (e.g. 27.2%)
  4. `Total Return Cost` (e.g. \$49,200)
  5. `Total Profit Loss` (e.g. \$168,400)
- **Visual 1 (Area / Line Chart)**: Return Rate Trend over Time (`DimDate[MonthYear]` on X-axis, `[Actual Return Rate]` on Y-axis).
- **Visual 2 (Horizontal Clustered Bar)**: Return Rate by Product Category (`DimCategory[CategoryName]` on Y-axis, `[Actual Return Rate]` on X-axis).
- **Visual 3 (Donut Chart)**: Return Volume Breakdown by Category.
- **Visual 4 (Table / Matrix)**: Category Performance Matrix (`CategoryName`, `Total Orders`, `Actual Returns`, `Actual Return Rate`, `Total Return Cost`).

### Page 2 — Return Risk Analytics (Predictive AI)
- **Top KPI Cards**:
  1. `Average Return Probability`
  2. `High Risk Orders`
  3. `High Risk Order Rate`
  4. `Model Precision`
- **Visual 1 (Column Chart)**: Order Distribution by Risk Category (`FactPredictions[RiskCategory]`, Count of Orders).
- **Visual 2 (Scatter Plot / Bubble Chart)**: Product Price vs Predicted Probability, colored by Risk Category.
- **Visual 3 (Decomposition Tree)**: Root-cause tree decomposing High-Risk Orders -> Category -> Payment Method -> Delivery Delay.
- **Visual 4 (Table)**: High-Risk Incoming Queue with proactive action flags.

### Page 3 — Root-Cause and Customer Analytics
- **Visual 1 (Bar Chart)**: Return Reasons Breakdown (`FactReturns[ReturnReason]`, Count of Returns, % of Total).
- **Visual 2 (Line Chart)**: Return Rate by Delivery Delay Days (`FactOrders[DeliveryDelayDays]`, `Actual Return Rate`).
- **Visual 3 (Clustered Column)**: Return Rate by Customer Age Group (`DimCustomer[AgeGroup]`, `Actual Return Rate`).
- **Visual 4 (Matrix)**: Payment Method vs Shipping Method Cross-Tab Return Rates.

### Page 4 — Financial and Sustainability Impact (ESG)
- **Top KPI Cards**:
  1. `Total Return Cost` (\$49.2K)
  2. `Total Profit Loss` (\$168.4K)
  3. `Total CO2 Emissions (kg)` (9,156 kg)
  4. `Total Packaging Waste (kg)` (2,125 kg)
  5. `Equivalent Trees Required` (421 trees)
- **Visual 1 (Waterfall Chart)**: Revenue -> Gross Returns Margin Loss -> Reverse Freight Cost -> Net Recovered Value.
- **Visual 2 (Bar Chart)**: CO2 Emissions and Packaging Waste by Merchandise Category.
- **Visual 3 (Gauge Chart)**: Projected Savings (20% Target Return Reduction) vs Baseline.

---

## 5. Refresh Procedure

To refresh the dataset with new model predictions or operational data:
1. Re-run:
   ```powershell
   python src/analytics/export_powerbi.py
   ```
2. In Power BI Desktop, click **Refresh** on the Home ribbon.
3. All visual cards, charts, and star schema relationships update in seconds.
