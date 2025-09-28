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
      './data/us-energy-consumption-by-source.csv', // Primary: U.S. Energy History 1950-2024 (74 years!)
      './data/epa-emissions-by-sector.csv',         // Secondary: EPA greenhouse gas emissions by sector
      './data/eia-renewable-generation.csv',       // Tertiary: EIA renewable energy generation
      './data/federal-budget-by-department.csv',   // Quaternary: Federal budget by department
      './data/babynames.csv',                      // Fallback: Original demo data
      // './data/unemployment.csv',
    ],

    // Dataset metadata for local development
    datasetInfo: {
      'us-energy-consumption-by-source.csv': {
        title: 'U.S. Primary Energy Consumption by Source (1950-2024)',
        description: '74 years of American energy history showing the complete transition from coal to diverse energy mix',
        source: 'EIA Monthly Energy Review Table 1.3',
        units: 'Quadrillion BTU',
        colorScheme: 'category10',
        streamOffset: 'wiggle',
        historicalNote: 'Shows oil crises, nuclear rise, natural gas boom, and renewable revolution'
      },
      'epa-emissions-by-sector.csv': {
        title: 'U.S. Greenhouse Gas Emissions by Sector',
        description: 'Annual greenhouse gas emissions by economic sector (1990-2022)',
        source: 'EPA Greenhouse Gas Inventory',
        units: 'Million Metric Tons CO2 Equivalent',
        colorScheme: 'category10',
        streamOffset: 'wiggle'
      },
      'eia-renewable-generation.csv': {
        title: 'U.S. Renewable Energy Generation by Source',
        description: 'Annual renewable electricity generation by source (2000-2023)',
        source: 'EIA Open Data',
        units: 'Billion Kilowatt-hours',
        colorScheme: 'category10',
        streamOffset: 'wiggle'
      },
      'federal-budget-by-department.csv': {
        title: 'U.S. Federal Budget by Department',
        description: 'Annual federal spending by major departments (2008-2023)',
        source: 'USAspending.gov & Treasury',
        units: 'Billions of Dollars',
        colorScheme: 'category10',
        streamOffset: 'wiggle'
      },
      'babynames.csv': {
        title: 'Baby Names by Sex (Demo Data)',
        description: 'Historical baby name popularity by sex',
        source: 'Demo dataset',
        units: 'Count',
        colorScheme: 'category10',
        streamOffset: 'wiggle'
      }
    }
  }
};