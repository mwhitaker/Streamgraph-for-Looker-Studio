import { resize } from './resize';
import { html } from 'htl'
import * as d3 from 'd3';
import { createStreamGraph } from './stream';
import { config } from './config';

import {
  subscribeToData,
  getHeight,
  getWidth,
  objectTransform
} from '@google/dscc'

const LOCAL = import.meta.env.DEV;

// Make LOCAL flag available globally
if (typeof window !== 'undefined') {
  window.LOCAL = LOCAL;
}

const parseDate = d3.utcParse("%Y%m%d");
const parseYear = d3.utcParse("%Y");

let chartStyle;

function parseTipOption(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "custom") return "custom";
  return value; // Return as-is for other values or if already parsed
}

function transformLookerInput(input) {
  const { tables, fields, style } = input;
  chartStyle = style;
  const data = tables.DEFAULT;

  // Create a mapping of field indices to their names
  const fieldMapping = {};
  for (const [key, fieldArray] of Object.entries(fields)) {
    fieldMapping[key] = fieldArray.map(field => field.name);
  }
  console.log("Field mapping:", fieldMapping);

  return data.map(item => {
    const result = {};

    // Handle Looker Studio format
    if (item.date && Array.isArray(item.date)) {
      // Date dimension
      const dateValue = item.date[0];
      result.date = LOCAL ? new Date(dateValue) : parseDate(dateValue);
    }

    if (item.category && Array.isArray(item.category)) {
      // Category dimension
      result.category = item.category[0];
    }

    if (item.other && Array.isArray(item.other)) {
      // Secondary dimension (e.g., sex)
      result.other = item.other[0];
    }

    if (item.value && Array.isArray(item.value)) {
      // Value metric
      const numValue = typeof item.value[0] === 'string' ? parseFloat(item.value[0]) : item.value[0];
      result.value = isNaN(numValue) ? 0 : numValue;
    }

    // For local development or other formats, use the original approach
    for (const [key, values] of Object.entries(item)) {
      if (Array.isArray(values)) {
        values.forEach((value, index) => {
          const fieldName = fieldMapping[key]?.[index];
          if (fieldName) {
            if (fieldName.toLowerCase().includes('date')) {
              result.date = LOCAL ? new Date(value) : parseDate(value);
            } else if (fieldName.toLowerCase().includes('category') || fieldName.toLowerCase().includes('industry')) {
              result.category = value;
            } else if (fieldName.toLowerCase().includes('other') || fieldName.toLowerCase().includes('sex') || fieldName.toLowerCase().includes('gender')) {
              result.other = value;
            } else if (fieldName.toLowerCase().includes('value') || fieldName.toLowerCase().includes('unemployed')) {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              result.value = isNaN(numValue) ? 0 : numValue;
            }
          }
        });
      }
    }

    return result;
  });
}

function validateStreamData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { valid: false, error: "No data provided" };
  }

  const requiredFields = ['date', 'category', 'value'];
  const sample = data[0];

  const missingFields = requiredFields.filter(field => !(field in sample));
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}. Available: ${Object.keys(sample).join(', ')}`
    };
  }

  // Check for valid dates
  const invalidDates = data.filter(d => !d.date || isNaN(new Date(d.date).getTime()));
  if (invalidDates.length > 0) {
    return { valid: false, error: `Invalid dates found in ${invalidDates.length} rows` };
  }

  return { valid: true };
}

function processDataset(transformedData) {
  console.log(`[Index] processDataset called at ${new Date().toISOString()}`);
  console.log("Stream data received by processDataset:", transformedData);

  // Validate data
  const validation = validateStreamData(transformedData);
  if (!validation.valid) {
    console.error("Data validation failed:", validation.error);
    showErrorMessage(validation.error);
    return;
  }

  // Clean up any existing containers and charts
  const existingContainer = document.getElementById('mainsite-center');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Also clean up any existing charts in case we're redrawing
  const existingCharts = document.querySelectorAll('.stream-chart svg');
  existingCharts.forEach(chart => chart.remove());

  // Create new container
  const container = document.createElement('div');
  container.id = 'mainsite-center';
  document.body.appendChild(container);

  // Extract color values
  function extractColorValue(colorConfig, defaultValue) {
    if (!colorConfig) return defaultValue;

    const possiblePaths = [
      colorConfig?.value?.color,
      colorConfig?.color?.value,
      colorConfig?.value,
      colorConfig?.color,
      colorConfig,
    ];

    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && path.startsWith('#')) {
        return path;
      }
    }

    return defaultValue;
  }

  const backgroundColor = extractColorValue(chartStyle?.fillColor, "#ffffff");
  const textColor = extractColorValue(chartStyle?.fontColor, "#000000");

  // Create main container with styling
  const main = html`
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: ${backgroundColor};
      color: ${textColor};
    }

    .stream-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 100vh;
      min-height: 300px;
      padding: 10px;
      background-color: ${backgroundColor};
      color: ${textColor};
      box-sizing: border-box;
      overflow: visible; /* Changed from hidden to visible */
    }

    .stream-title {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
      color: ${textColor};
      flex-shrink: 0;
    }

    .stream-chart {
      width: 100%;
      height: calc(100% - 40px); /* Account for title height */
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: ${backgroundColor};
      overflow: visible; /* Changed from auto to visible */
    }

    .stream-chart svg {
      max-width: 100%;
      max-height: 100%;
      overflow: visible !important;
    }

    [class*="plot-"],
    [class*="plot-"] *,
    .plot-d6a7b5-figure,
    .plot-d6a7b5-swatches,
    .plot-d6a7b5-swatches-wrap,
    .plot-d6a7b5-swatch {
      background-color: ${backgroundColor} !important;
      color: ${textColor} !important;
    }

    svg.plot-d6a7b5 {
      background-color: ${backgroundColor} !important;
    }

    @media (min-width: 768px) {
      .stream-container {
        min-height: 600px;
      }
    }
  </style>
  <main id="mainsite-main" class="mainsite">
    <div class="stream-container">
      <div id="stream-chart" class="stream-chart"></div>
    </div>
  </main>
  `;

  container.appendChild(main);

  // Get the chart container
  const streamChartContainer = document.getElementById('stream-chart');

  // Get chart dimensions from user configuration or use defaults
  const configuredWidth = parseInt(chartStyle?.chartWidth?.value || "1024");
  const configuredHeight = parseInt(chartStyle?.chartHeight?.value || "768");

  // For LOCAL development, use configured size or fallback
  // For Looker Studio, use configured size but respect container limits
  let width, height;

  if (LOCAL) {
    width = configuredWidth;
    height = configuredHeight;
  } else {
    const containerWidth = getWidth();
    const containerHeight = getHeight();

    // Use configured size but don't exceed container
    width = Math.min(configuredWidth, containerWidth - 20);
    height = Math.min(configuredHeight, containerHeight - 40); // Account for title

    // Ensure minimum viable size
    width = Math.max(300, width);
    height = Math.max(200, height);
  }

  console.log(`[Index] Configured size: ${configuredWidth}x${configuredHeight}, Final chart size: ${width}x${height}`);
  console.log(`[Index] Chart style configuration:`, chartStyle);

  // Pass all chart options
  const chartOptions = {
    width: width,
    height: height,
    backgroundColor: backgroundColor,
    textColor: textColor,
    colorScheme: chartStyle?.colorScheme?.value || config.looker.defaultChartOptions.colorScheme,
    streamOffset: chartStyle?.streamOffset?.value || config.looker.defaultChartOptions.streamOffset,
    marginTop: chartStyle?.marginTop?.value || config.looker.defaultChartOptions.marginTop,
    marginRight: chartStyle?.marginRight?.value || config.looker.defaultChartOptions.marginRight,
    marginBottom: chartStyle?.marginBottom?.value || config.looker.defaultChartOptions.marginBottom,
    marginLeft: chartStyle?.marginLeft?.value || config.looker.defaultChartOptions.marginLeft,
    tip: parseTipOption(chartStyle?.tip?.value) || config.looker.defaultChartOptions.tip,
  };

  console.log("[Index] Chart options passed to stream:", JSON.stringify(chartOptions, null, 2));

  // Create the chart
  const chart = createStreamGraph(transformedData, chartOptions);
  streamChartContainer.appendChild(chart);

  console.log("Stream graph initialized");
}

function showErrorMessage(message) {
  const errorContainer = document.createElement('div');
  errorContainer.style.padding = '20px';
  errorContainer.style.color = 'red';
  errorContainer.style.textAlign = 'center';
  errorContainer.innerHTML = `
    <h3>Data Error</h3>
    <p>${message}</p>
    <p>Check browser console for details</p>
  `;
  document.body.innerHTML = '';
  document.body.appendChild(errorContainer);
}

function transformCsvToLookerFormat(csvData) {
  console.log("Original CSV data:", csvData);

  if (!csvData || csvData.length === 0) {
    throw new Error("No CSV data provided");
  }

  // Get column names from first row
  const columns = Object.keys(csvData[0]);
  console.log("Available columns:", columns);

  // Auto-detect column mappings
  const columnMappings = detectColumnMappings(columns);
  console.log("Detected column mappings:", columnMappings);

  if (!columnMappings.date || !columnMappings.category || !columnMappings.value) {
    throw new Error(`Required columns not found. Available: ${columns.join(', ')}. Need columns containing: date, category/sex, value`);
  }

  // Transform CSV to time series format for stream graph
  const transformedData = [];

  csvData.forEach(row => {
    const rawDate = row[columnMappings.date];
    let parsedDate;

    // Handle different date formats
    if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\d{4}$/.test(rawDate))) {
      // Simple year format (e.g., 1880, 1881)
      // Create a date for January 1st of that year
      parsedDate = new Date(parseInt(rawDate), 0, 1);
    } else if (typeof rawDate === 'string' && rawDate.includes('-')) {
      // ISO date format
      parsedDate = new Date(rawDate);
    } else {
      // Try default parsing
      parsedDate = new Date(rawDate);
    }

    const dataPoint = {
      date: [parsedDate],
      category: [row[columnMappings.category]],
      value: [parseFloat(row[columnMappings.value]) || 0]
    };

    // Add secondary dimension if detected
    if (columnMappings.secondary) {
      dataPoint.other = [row[columnMappings.secondary]];
    }

    transformedData.push(dataPoint);
  });

  const fields = {
    date: [{
      id: "date",
      name: "Date",
      type: "DATE",
      concept: "DIMENSION"
    }],
    category: [{
      id: "category",
      name: "Category",
      type: "TEXT",
      concept: "DIMENSION"
    }],
    value: [{
      id: "value",
      name: "Value",
      type: "NUMBER",
      concept: "METRIC"
    }]
  };

  const tables = {
    DEFAULT: transformedData
  };

  const style = {
    streamOffset: {
      value: config.looker.defaultChartOptions.streamOffset,
      defaultValue: "wiggle"
    },
    title: {
      value: config.looker.defaultChartOptions.title,
      defaultValue: "Stream Graph"
    },
    colorScheme: {
      value: config.looker.defaultChartOptions.colorScheme,
      defaultValue: "category10"
    },
    fillColor: {
      color: {
        value: "#ffffff"
      }
    },
    fontColor: {
      color: {
        value: "#000000"
      }
    },
    marginTop: {
      value: config.looker.defaultChartOptions.marginTop,
      defaultValue: "20"
    },
    marginRight: {
      value: config.looker.defaultChartOptions.marginRight,
      defaultValue: "30"
    },
    marginBottom: {
      value: config.looker.defaultChartOptions.marginBottom,
      defaultValue: "40"
    },
    marginLeft: {
      value: config.looker.defaultChartOptions.marginLeft,
      defaultValue: "60"
    }
  };

  console.log("Transformed to Looker format:", { tables, fields, style });
  return { tables, fields, style };
}

function detectColumnMappings(columns) {
  const mappings = {};

  // Convert to lowercase for case-insensitive matching
  const lowerColumns = columns.map(col => col.toLowerCase());

  // Detect date column
  const datePatterns = ['date', 'time', 'year', 'month', 'day'];
  mappings.date = columns.find((_, i) =>
    datePatterns.some(pattern => lowerColumns[i].includes(pattern))
  );

  // Detect category column (primary dimension - usually the main categorical variable)
  const categoryPatterns = ['category', 'group', 'type', 'class', 'name'];
  mappings.category = columns.find((_, i) =>
    categoryPatterns.some(pattern => lowerColumns[i].includes(pattern))
  );

  // Detect secondary dimension (sex, gender, other grouping variable)
  const secondaryPatterns = ['sex', 'gender', 'other', 'secondary', 'subgroup'];
  mappings.secondary = columns.find((_, i) =>
    secondaryPatterns.some(pattern => lowerColumns[i].includes(pattern))
  );

  // Detect value column
  const valuePatterns = ['value', 'amount', 'count', 'number', 'prop', 'rate', 'percent'];
  mappings.value = columns.find((_, i) =>
    valuePatterns.some(pattern => lowerColumns[i].includes(pattern))
  );

  return mappings;
}

function renderVisualization(inputData) {
  console.log(`[Index] renderVisualization called at ${new Date().toISOString()}`);

  if (LOCAL) {
    // Use sample data paths from config
    const csvPaths = config.local.sampleDataPaths;

    const tryLoadFromPath = (pathIndex) => {
      if (pathIndex >= csvPaths.length) {
        console.error("Could not load CSV data from any of the specified paths");
        showErrorMessage(`Data file not found. Expected paths: ${csvPaths.join(', ')}`);
        return;
      }

      const path = csvPaths[pathIndex];
      console.log(`Trying to load CSV from: ${path}`);

      d3.csv(path, d3.autoType)
        .then(csvData => {
          console.log("Data loaded from:", path, csvData);

          const isValidCsv = csvData &&
                            csvData.length > 0 &&
                            Object.keys(csvData[0]).length > 1;

          if (!isValidCsv) {
            console.error("Invalid CSV data format received from:", path);
            throw new Error("Invalid CSV format");
          }

          console.log("Valid CSV data loaded from:", path);
          const lookerFormatData = transformCsvToLookerFormat(csvData);
          const dataset = transformLookerInput(lookerFormatData);
          console.log("Final dataset:", dataset);
          processDataset(dataset);
        })
        .catch(error => {
          console.error(`Error loading CSV from ${path}:`, error);
          tryLoadFromPath(pathIndex + 1);
        });
    };

    tryLoadFromPath(0);
  } else {
    // Production mode (Looker Studio)
    console.log("Looker Studio data received:", JSON.stringify(inputData, null, 2));

    try {
      console.log("Input fields structure:", inputData.fields);
      console.log("Input tables structure:", inputData.tables);
      console.log("Input style structure:", inputData.style);

      const dataset = transformLookerInput(inputData);
      console.log("Transformed dataset:", dataset);

      processDataset(dataset);
    } catch (error) {
      console.error("Error processing Looker Studio data:", error);
      showErrorMessage(`Error processing data: ${error.message}`);
    }
  }
}

// Call renderVisualization
if (LOCAL) {
  renderVisualization({});
} else {
  subscribeToData(renderVisualization, { transform: objectTransform });
}