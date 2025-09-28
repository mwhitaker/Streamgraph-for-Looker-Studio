import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export function createStreamGraph(data, options = {}) {
  const {
    width = 800,
    height = 600,
    backgroundColor = "#ffffff",
    textColor = "#000000",
    colorScheme = "category10",
    streamOffset: rawStreamOffset = "wiggle",
    marginTop = 20,
    marginRight = 30,
    marginBottom = 40,
    marginLeft = 60,
    tip = true // true, false, or "custom"
  } = options;

  // Convert "none" string to null for streamOffset
  const streamOffset = rawStreamOffset === "none" ? null : rawStreamOffset;

  console.log("[Stream] Creating stream graph with data:", data);
  console.log("[Stream] Chart options:", options);

  // Validate data structure
  if (!Array.isArray(data) || data.length === 0) {
    console.error("[Stream] Invalid or empty data provided");
    return createErrorMessage("No data available for stream graph");
  }

  // Check if data has required fields
  const requiredFields = ['date', 'category', 'value'];
  const sampleRow = data[0];
  const hasRequiredFields = requiredFields.every(field => field in sampleRow);

  if (!hasRequiredFields) {
    console.error("[Stream] Data missing required fields:", requiredFields);
    console.log("[Stream] Available fields:", Object.keys(sampleRow));
    return createErrorMessage(`Data must contain fields: ${requiredFields.join(', ')}`);
  }

  // Sort data by date to ensure proper ordering and filter out zero/very small values
  let sortedData = [...data]
    .filter(d => d.value > 0) // Remove zero or negative values
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });


  console.log("[Stream] Sorted data sample:", sortedData.slice(0, 3));

  try {
    // Calculate responsive margins based on container size
    const responsiveMarginTop = Math.max(10, Math.min(parseInt(marginTop), height * 0.1));
    const responsiveMarginRight = Math.max(10, Math.min(parseInt(marginRight), width * 0.05));
    const responsiveMarginBottom = Math.max(30, Math.min(parseInt(marginBottom), height * 0.15));
    const responsiveMarginLeft = Math.max(40, Math.min(parseInt(marginLeft), width * 0.1));

    console.log(`[Stream] Responsive margins - Top: ${responsiveMarginTop}, Right: ${responsiveMarginRight}, Bottom: ${responsiveMarginBottom}, Left: ${responsiveMarginLeft}`);

    const chart = Plot.plot({
      width,
      height,
      marginTop: responsiveMarginTop,
      marginRight: responsiveMarginRight,
      marginBottom: responsiveMarginBottom,
      marginLeft: responsiveMarginLeft,
      style: {
        background: backgroundColor,
        color: textColor
      },
      x: {
        type: "time",
        label: "Date"
      },
      y: {
        grid: true,
        label: "Value"
      },
      color: {
        legend: true,
        scheme: colorScheme,
        columns: width > 600 ? 6 : 3, // Responsive legend columns
        width: width > 600 ? undefined : Math.min(200, width * 0.8) // Constrain legend width on small screens
      },
      marks: [
        Plot.areaY(sortedData, {
          x: "date",
          y: "value",
          fill: "category",
          offset: streamOffset,
          tip: tip === true ? true : false,
          curve: "basis" // Smooth curves for better stream appearance
        }),
        // Add custom tip marks when tip === "custom"
        ...(tip === "custom" ? [
          Plot.tip(
            sortedData,
            Plot.pointerX(
              Plot.binX(
                {title: (v) => v},
                {
                  x: "date",
                  thresholds: 100,
                  render(index, scales, values, dimensions, context) {
                    const g = d3.select(context.ownerSVGElement).append("g");
                    const [i] = index;
                    if (i !== undefined) {
                      const data = values.title[i].filter(d => d.value > 0);
                      const tooltipX = Math.min(
                        values.x1[i],
                        dimensions.width - dimensions.marginRight - 280
                      );

                      // Add the rule line that connects to the tooltip
                      g.append("line")
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", dimensions.marginTop)
                        .attr("y2", dimensions.height - dimensions.marginBottom)
                        .attr("stroke", textColor)
                        .attr("stroke-width", 1)
                        .attr("transform", `translate(${values.x1[i] - tooltipX}, 0)`);

                      g.attr(
                        "transform",
                        `translate(${tooltipX}, 0)`
                      ).append(() =>
                        Plot.plot({
                          marginTop: 18,
                          marginLeft: 10,
                          marginRight: 10,
                          marginBottom: 8,
                          height: Math.max(120, data.length * 16 + 40),
                          width: 275,
                          axis: null,
                          y: {domain: data.map(d => d.category)},
                          marks: [
                            Plot.frame({ fill: backgroundColor, stroke: textColor }),
                            Plot.dot(data, {
                              y: "category",
                              fill: (d) => scales.color(d.category),
                              r: 6,
                              frameAnchor: "left",
                              symbol: "square2",
                              dx: 12
                            }),
                            Plot.text(data, {
                              y: "category",
                              text: "category",
                              frameAnchor: "left",
                              dx: 24,
                              fill: textColor,
                              fontSize: 12
                            }),
                            Plot.text(data, {
                              y: "category",
                              text: d => d.value.toLocaleString(),
                              frameAnchor: "right",
                              dx: -12,
                              fill: textColor,
                              fontSize: 12,
                              fontWeight: "bold"
                            }),
                            Plot.text([data[0]], {
                              frameAnchor: "top-left",
                              dy: -15,
                              text: d => new Date(d.date).toLocaleDateString(),
                              fill: textColor,
                              fontSize: 13,
                              fontWeight: "bold"
                            })
                          ]
                        })
                      );
                    }
                    return g.node();
                  }
                }
              )
            )
          )
        ] : [])
      ]
    });

    // Apply custom styling to ensure proper theming
    if (chart) {
      chart.style.backgroundColor = backgroundColor;
      chart.style.color = textColor;

      // Ensure SVG has proper overflow settings
      chart.style.overflow = 'visible';

      console.log("[Stream] Chart created successfully");
    }

    return chart;

  } catch (error) {
    console.error("[Stream] Error creating chart:", error);
    return createErrorMessage(`Error creating stream graph: ${error.message}`);
  }
}


function createErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 400px;
    background-color: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    color: #6c757d;
    text-align: center;
    padding: 20px;
    box-sizing: border-box;
  `;
  errorDiv.textContent = message;
  return errorDiv;
}