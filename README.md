# Looker Studio Stream Graph Visualization

A custom stream graph visualization component for Looker Studio that displays time-series data as flowing, layered streams.

## Features

- Interactive stream graph visualization using Observable Plot
- Multiple layout options (wiggle, silhouette, expand, diverging)
- Configurable color schemes
- Custom tooltip displaying detailed data information
- Responsive design for various screen sizes

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Data Format

The visualization expects time-series data with the following structure:
- **Date/Time column**: Temporal dimension
- **Category column**: Grouping dimension for different streams
- **Value column**: Numeric values to visualize

## Configuration

Configure the visualization through the Looker Studio interface:
- Choose different stream layouts
- Select color schemes
- Adjust sizing and spacing options

## Custom Tooltip

The visualization includes a custom tooltip that appears on hover, showing:
- Exact date/time
- Category name
- Precise values
- Additional context information

## Deployment

Deploy to Google Cloud Platform:
```bash
GCP_BUCKET=${GCP_BUCKET:-"gs://your-bucket/your-viz"}
echo "Uploading files to $GCP_BUCKET..."
gsutil cp -a public-read dist/index.js $GCP_BUCKET/index.js
gsutil cp -a public-read dist/index.css $GCP_BUCKET/index.css
gsutil cp -a public-read dist/index.json $GCP_BUCKET/index.json
gsutil cp -a public-read dist/manifest.json $GCP_BUCKET/manifest.json
gsutil cp -a public-read dist/stream-graph-icon.png $GCP_BUCKET/stream-graph-icon.png
```

Make sure to update GCP credentials before deployment.