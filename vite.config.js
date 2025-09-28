import { defineConfig } from 'vite';
import { resolve } from 'path';
import path from 'path';

import { writeFileSync } from 'fs';

export default defineConfig({
  resolve: {
    alias: {
      '@observablehq/runtime': path.resolve(__dirname, 'node_modules/@observablehq/runtime'),
      '@observablehq/inputs': path.resolve(__dirname, 'node_modules/@observablehq/inputs'),
      'd3': path.resolve(__dirname, 'node_modules/d3')
    }
  },
  optimizeDeps: {
    include: ['@observablehq/runtime', '@observablehq/inputs', 'd3']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VizLib',
      fileName: 'index',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css';
          return assetInfo.name;
        },
      }
    },
    minify: 'terser', // Enable Terser minification
    sourcemap: false, // Disable sourcemap generation
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.* statements
        drop_debugger: true, // Remove debugger statements
      },
    }
  },
  plugins: [
    {
      name: 'generate-index-json',
      closeBundle() {
        const indexJson = {
          "data": [
            {
              "id": "dimensions",
              "label": "Stream Graph Data",
              "elements": [
                {
                  "id": "date",
                  "label": "Date",
                  "type": "DIMENSION",
                  "options": {
                    "min": 1,
                    "max": 1
                  }
                },
                {
                  "id": "category",
                  "label": "Category",
                  "type": "DIMENSION",
                  "options": {
                    "min": 1,
                    "max": 1
                  }
                },
                {
                  "id": "value",
                  "label": "Value",
                  "type": "METRIC",
                  "options": {
                    "min": 1,
                    "max": 1
                  }
                }
              ]
            }
          ],
          "style": [
            {
              "id": "styleOptions",
              "label": "Stream Graph Options",
              "elements": [
                {
                  "id": "fillColor",
                  "label": "Background Color",
                  "type": "FILL_COLOR",
                  "defaultValue": "#ffffff"
                },
                {
                  "id": "fontColor",
                  "label": "Text Color",
                  "type": "FONT_COLOR",
                  "defaultValue": "#000000"
                },
                {
                  "id": "colorScheme",
                  "label": "Color Scheme",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "category10",
                  "options": [
                    {
                      "label": "Category 10",
                      "value": "category10"
                    },
                    {
                      "label": "Tableau 10",
                      "value": "tableau10"
                    },
                    {
                      "label": "Set 1",
                      "value": "set1"
                    },
                    {
                      "label": "Set 2",
                      "value": "set2"
                    },
                    {
                      "label": "Paired",
                      "value": "paired"
                    }
                  ]
                },
                {
                  "id": "streamOffset",
                  "label": "Stream Layout",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "wiggle",
                  "options": [
                    {
                      "label": "Wiggle",
                      "value": "wiggle"
                    },
                    {
                      "label": "Silhouette",
                      "value": "silhouette"
                    },
                    {
                      "label": "Expand",
                      "value": "expand"
                    },
                    {
                      "label": "None",
                      "value": "none"
                    }
                  ]
                },
                {
                  "id": "marginTop",
                  "label": "Chart Top Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "20"
                },
                {
                  "id": "marginRight",
                  "label": "Chart Right Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "30"
                },
                {
                  "id": "marginBottom",
                  "label": "Chart Bottom Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "40"
                },
                {
                  "id": "marginLeft",
                  "label": "Chart Left Margin",
                  "type": "TEXTINPUT",
                  "defaultValue": "60"
                },
                {
                  "id": "chartWidth",
                  "label": "Chart Width (px)",
                  "type": "TEXTINPUT",
                  "defaultValue": "600"
                },
                {
                  "id": "chartHeight",
                  "label": "Chart Height (px)",
                  "type": "TEXTINPUT",
                  "defaultValue": "400"
                },
                {
                  "id": "tip",
                  "label": "Tooltip Style",
                  "type": "SELECT_SINGLE",
                  "defaultValue": "true",
                  "options": [
                    {
                      "label": "Basic Tooltips",
                      "value": "true"
                    },
                    {
                      "label": "No Tooltips",
                      "value": "false"
                    },
                    {
                      "label": "Custom Grouped Tooltips",
                      "value": "custom"
                    }
                  ]
                }
              ]
            }
          ]
        };
        writeFileSync('dist/index.json', JSON.stringify(indexJson, null, 2));
      }
    }
  ],
  define: {
    'process.env.DEVMODE_BOOL': JSON.stringify(process.env.DEVMODE_BOOL),
  },
});