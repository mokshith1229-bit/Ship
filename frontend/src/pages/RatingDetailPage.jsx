import React from 'react';
import { useLocation } from 'react-router-dom';
import GenericRatingPage from '../components/Rating/GenericRatingPage';
import { roadwayConfig, roadSignConfig, drainageConfig, crashBarrierConfig } from '../config/ratingConfigs';

const RatingDetailPage = () => {
  const location = useLocation();
  const rowData = location.state || {};

  // Determine which configuration to use based on the category and assetType
  let selectedConfig = roadwayConfig; // Default fallback

  const category = rowData.category || '';
  const assetType = rowData.assetType || '';

  if (category === 'Road Signage and Furniture') {
    selectedConfig = roadSignConfig;
  } else if (category === 'Roadway') {
    if (assetType === 'Drainage') {
      selectedConfig = drainageConfig;
    } else if (assetType === 'Crash Barrier') {
      // In case Crash Barrier gets added to Roadway
      selectedConfig = crashBarrierConfig;
    } else {
      selectedConfig = roadwayConfig;
    }
  } else if (category === 'Structures') {
    // If you want a specific config for structures later, add it. Falling back to roadway for now.
    selectedConfig = roadwayConfig;
  }

  return <GenericRatingPage rowData={rowData} config={selectedConfig} />;
};

export default RatingDetailPage;
