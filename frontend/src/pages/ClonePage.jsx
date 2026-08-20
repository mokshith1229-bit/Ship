import React from 'react';
import CloneRatingPage from '../components/Rating/CloneRatingPage';
import { cloneConfig } from '../config/ratingConfigs';

const ClonePage = () => {
  // Pass some dummy rowData to perfectly mimic the existing pages
  const rowData = {
    category: 'Clone Category',
    assetType: 'Clone Asset',
    direction: 'LHS',
    roadType: 'MCW',
    chainage: '100'
  };

  return (
    <CloneRatingPage rowData={rowData} config={cloneConfig} />
  );
};

export default ClonePage;
