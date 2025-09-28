/**
 * Configuration for the Looker Stream Graph project
 * This file contains values specific to your development environment
 * DO NOT commit this file to version control
 */

export const config = {
  // Looker Studio settings
  looker: {
    // Default chart options that will be used when running locally
    defaultChartOptions: {
      streamOffset: "wiggle",
      title: "Stream Graph Visualization",
      colorScheme: "category10",
      marginTop: "20",
      marginRight: "30",
      marginBottom: "40",
      marginLeft: "60",
      tip: "custom" // true, false, or "custom"
    }
  },

  // Local development settings
  local: {
    // Sample data paths to try (in order of preference)
    sampleDataPaths: [
      './data/babynames.csv',
      // './data/unemployment.csv',
    ]
  }
};