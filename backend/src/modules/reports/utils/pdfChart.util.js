'use strict';

/**
 * Utility class to draw charts natively in PDFKit without external dependencies.
 */

// Helper: draw text with truncation
function drawTextCentered(doc, text, x, y, width, options = {}) {
  doc.text(text, x, y, { width, align: 'center', ...options });
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}

/**
 * Draws a donut chart
 * @param {PDFDocument} doc 
 * @param {number} x Center X
 * @param {number} y Center Y
 * @param {number} radius Outer radius
 * @param {number} thickness Thickness of donut
 * @param {Array<{value: number, color: string, label: string}>} data 
 */
function drawDonutChart(doc, x, y, radius, thickness, data, totalText, totalValue, legendX, legendY) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  if (total === 0) {
    doc.fillColor('#dddddd').circle(x, y, radius - thickness / 2).lineWidth(thickness).stroke();
    doc.fillColor('#666666').fontSize(10).text('No Data', x - 20, y - 5);
    return;
  }

  let currentAngle = 0;
  data.forEach(item => {
    if (item.value === 0) return;
    const sliceAngle = (item.value / total) * 360;
    
    // Draw slice
    if (sliceAngle === 360) {
      doc.circle(x, y, radius - thickness / 2).lineWidth(thickness).strokeColor(item.color || '#cccccc').stroke();
    } else {
      const arcPath = describeArc(x, y, radius - thickness / 2, currentAngle, currentAngle + sliceAngle);
      doc.path(arcPath).lineWidth(thickness).strokeColor(item.color || '#cccccc').stroke();
    }
    
    // Add percentage label on the donut (if big enough)
    if (sliceAngle > 10) {
      const midAngle = currentAngle + sliceAngle / 2;
      const labelPos = polarToCartesian(x, y, radius + 12, midAngle);
      const perc = ((item.value / total) * 100).toFixed(1) + '%';
      doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text(perc, labelPos.x - 15, labelPos.y - 4, { width: 30, align: 'center' });
    }
    
    currentAngle += sliceAngle;
  });

  // Center text
  if (totalValue !== undefined) {
    doc.fillColor('#333333').fontSize(14).font('Helvetica-Bold').text(totalValue, x - 40, y - 8, { width: 80, align: 'center' });
    doc.fillColor('#666666').fontSize(7).font('Helvetica').text(totalText, x - 40, y + 8, { width: 80, align: 'center' });
  }

  // Draw Legend
  if (legendX !== undefined && legendY !== undefined) {
    let lY = legendY;
    data.forEach(item => {
      doc.circle(legendX, lY + 3, 3).fillColor(item.color || '#cccccc').fill();
      doc.fillColor('#333333').fontSize(7).font('Helvetica-Bold').text(item.label, legendX + 8, lY);
      
      const perc = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      doc.fillColor('#666666').fontSize(7).font('Helvetica').text(`${item.value} (${perc}%)`, legendX + 8, lY + 9);
      lY += 20;
    });
  }
}

function drawSimpleLegend(doc, legendX, legendY, items) {
  let lY = legendY;
  items.forEach(item => {
    doc.circle(legendX, lY + 3, 3).fillColor(item.color || '#cccccc').fill();
    doc.fillColor('#333333').fontSize(8).font('Helvetica-Bold').text(item.label, legendX + 8, lY);
    
    if (item.subtext) {
      doc.fillColor('#666666').fontSize(7).font('Helvetica').text(item.subtext, legendX + 8, lY + 10);
      lY += 20;
    } else {
      lY += 16;
    }
  });
}

/**
 * Draws a horizontal bar chart
 */
function drawHorizontalBarChart(doc, startX, startY, width, height, data) {
  if (!data || data.length === 0) {
    doc.fillColor('#666666').fontSize(10).text('No Data', startX, startY);
    return;
  }

  const barHeight = Math.min(12, (height / data.length) - 4);
  const maxLabelWidth = 130;
  const chartStartX = startX + maxLabelWidth + 10;
  const chartWidth = width - maxLabelWidth - 40;
  
  let currentY = startY;

  // Draw X axis grid/labels
  doc.lineWidth(0.5).strokeColor('#eeeeee');
  [0, 0.25, 0.5, 0.75, 1].forEach(pct => {
    const x = chartStartX + (chartWidth * pct);
    doc.moveTo(x, startY).lineTo(x, startY + height).stroke();
    doc.fillColor('#999999').fontSize(7).font('Helvetica').text((pct * 100) + '%', x - 10, startY + height + 5, { width: 20, align: 'center' });
  });

  data.forEach(item => {
    // Label
    doc.fillColor('#333333').fontSize(8).font('Helvetica').text(item.label, startX, currentY + (barHeight/2) - 4, { width: maxLabelWidth, align: 'left', lineBreak: false, ellipsis: true });
    
    // Bar
    const barW = (item.percentage / 100) * chartWidth;
    let color = '#4caf50'; // Green
    if (item.percentage >= 60) color = '#f44336'; // Red
    else if (item.percentage >= 30) color = '#ff9800'; // Amber
    else if (item.percentage >= 10) color = '#ffeb3b'; // Yellow

    if (barW > 0) {
      doc.roundedRect(chartStartX, currentY, barW, barHeight, 2).fillColor(color).fill();
    }
    
    // Value text
    doc.fillColor('#333333').fontSize(8).font('Helvetica').text(`${item.percentage.toFixed(0)}%`, chartStartX + barW + 5, currentY + (barHeight/2) - 4);
    
    currentY += barHeight + 4;
  });
}

/**
 * Draws a pareto chart (bar + line)
 */
function drawParetoChart(doc, startX, startY, width, height, data) {
  if (!data || data.length === 0) {
    doc.fillColor('#666666').fontSize(10).text('No Data', startX, startY);
    return;
  }

  const numColumns = data.length > 7 ? 2 : 1;
  const columnWidth = width / numColumns;
  const maxLabelWidth = numColumns === 2 ? 90 : 120;
  // Reduce chart width slightly to give the count label more room
  const chartWidth = columnWidth - maxLabelWidth - (numColumns === 2 ? 30 : 40);
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const itemsPerColumn = Math.ceil(data.length / numColumns);
  const barHeight = Math.min(14, (height / itemsPerColumn) - 6);
  
  // Draw legend at top center
  const legendX = startX + width / 2 - 40;
  doc.rect(legendX, startY - 5, 8, 8).fillColor('#1976d2').fill();
  doc.fillColor('#333333').fontSize(8).font('Helvetica').text('Observations', legendX + 12, startY - 4);

  data.forEach((item, idx) => {
    const col = Math.floor(idx / itemsPerColumn);
    const row = idx % itemsPerColumn;
    
    // Shift the second column to the right to utilize empty space and prevent overlap
    const columnShift = col === 1 ? 25 : 0;
    const colStartX = startX + (col * columnWidth) + columnShift;
    const currentY = startY + 10 + (row * (barHeight + 6));
    const chartStartX = colStartX + maxLabelWidth + (numColumns === 2 ? 5 : 10);
    
    // Label
    const fontSize = numColumns === 2 ? 7 : 8;
    const yOffset = fontSize === 7 ? -3 : -4;
    doc.fillColor('#333333').fontSize(fontSize).font('Helvetica').text(item.label, colStartX, currentY + (barHeight/2) + yOffset, { width: maxLabelWidth, align: 'left', lineBreak: false, ellipsis: true });
    
    // Bar
    const barW = (item.count / maxCount) * chartWidth;
    if (barW > 0) {
      doc.rect(chartStartX, currentY, barW, barHeight).fillColor('#1976d2').fill(); // Blue bar
    }
    
    // Count label
    doc.fillColor('#333333').fontSize(fontSize).font('Helvetica').text(item.count.toString(), chartStartX + barW + 5, currentY + (barHeight/2) + yOffset);
  });
}


/**
 * Draws a Scatter Plot for Chainage Hotspots
 */
function drawScatterPlot(doc, startX, startY, width, height, data, minChainage, maxChainage) {
  const chartStartX = startX + 20;
  const chartStartY = startY + 20;
  const chartWidth = width - 30;
  const chartHeight = height - 40;

  if (!data || data.length === 0) {
    doc.fillColor('#666666').fontSize(10).text('No Data Available for Scatter Plot', startX + width/2 - 60, startY + height/2);
    return;
  }

  const maxIssues = Math.max(...data.map(d => d.count), 5);
  // Give some padding to chainage range
  let cMin = minChainage != null ? minChainage : Math.min(...data.map(d => d.chainage));
  let cMax = maxChainage != null ? maxChainage : Math.max(...data.map(d => d.chainage));
  if (cMin === cMax) { cMin -= 1; cMax += 1; }
  const cRange = cMax - cMin;

  // Find Hotspot (if we have a dense cluster of rating 1 issues)
  let hotspotMin = null;
  let hotspotMax = null;
  const r1Data = data.filter(d => d.rating === 1);
  if (r1Data.length > 3) {
    // simple clustering (bounding box of all rating 1s)
    hotspotMin = Math.min(...r1Data.map(d => d.chainage));
    hotspotMax = Math.max(...r1Data.map(d => d.chainage));
    // If it spans the whole thing, just highlight a dense part or skip
    if (hotspotMax - hotspotMin > cRange * 0.5 && r1Data.length < 10) {
      hotspotMin = null; hotspotMax = null;
    }
  }

  // Draw Hotspot Background
  if (hotspotMin !== null && hotspotMax !== null && hotspotMax > hotspotMin) {
    const hsX = chartStartX + ((hotspotMin - cMin) / cRange) * chartWidth;
    const hsW = Math.max(5, ((hotspotMax - hotspotMin) / cRange) * chartWidth);
    doc.rect(hsX, chartStartY, hsW, chartHeight).fillColor('#ffebee').fill();
    
    // Callout
    doc.rect(hsX + hsW + 5, chartStartY + 10, 80, 25).fillColor('#ffffff').strokeColor('#cccccc').lineWidth(0.5).fillAndStroke();
    doc.fillColor('#333333').fontSize(7).text(`High issue concentration in ${hotspotMin.toFixed(1)} - ${hotspotMax.toFixed(1)} km stretch`, hsX + hsW + 8, chartStartY + 13, { width: 74 });
    
    // Pointer line
    doc.moveTo(hsX + hsW, chartStartY + 20).lineTo(hsX + hsW + 5, chartStartY + 20).strokeColor('#cccccc').stroke();
  }

  // Draw X and Y axes
  doc.lineWidth(1).strokeColor('#999999');
  doc.moveTo(chartStartX, chartStartY).lineTo(chartStartX, chartStartY + chartHeight).stroke(); // Y
  doc.moveTo(chartStartX, chartStartY + chartHeight).lineTo(chartStartX + chartWidth, chartStartY + chartHeight).stroke(); // X

  // Grid and Y labels (0 to maxIssues)
  doc.lineWidth(0.5).strokeColor('#eeeeee');
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const yVal = Math.round((i / ySteps) * maxIssues);
    const yPos = chartStartY + chartHeight - ((yVal / maxIssues) * chartHeight);
    if (i > 0) doc.moveTo(chartStartX, yPos).lineTo(chartStartX + chartWidth, yPos).stroke();
    doc.fillColor('#666666').fontSize(7).text(yVal.toString(), chartStartX - 15, yPos - 3, { width: 10, align: 'right' });
  }

  // Grid and X labels (min to max chainage)
  const xSteps = 4;
  for (let i = 0; i <= xSteps; i++) {
    const xVal = cMin + (i / xSteps) * cRange;
    const xPos = chartStartX + ((xVal - cMin) / cRange) * chartWidth;
    if (i > 0 && i < xSteps) doc.moveTo(xPos, chartStartY).lineTo(xPos, chartStartY + chartHeight).stroke();
    doc.fillColor('#666666').fontSize(7).text(xVal.toFixed(0), xPos - 10, chartStartY + chartHeight + 5, { width: 20, align: 'center' });
  }

  // Draw Legend
  let legX = startX + 20;
  [
    { color: '#d32f2f', label: 'Rating 1 (Critical)' },
    { color: '#ff9800', label: 'Rating 5 (Minor)' },
    { color: '#4caf50', label: 'Rating 10 (Good)' }
  ].forEach(leg => {
    doc.circle(legX, startY + 5, 3).fillColor(leg.color).fill();
    doc.fillColor('#333333').fontSize(8).text(leg.label, legX + 8, startY + 2);
    legX += 80;
  });

  // Plot Data
  data.forEach(d => {
    const pX = chartStartX + ((d.chainage - cMin) / cRange) * chartWidth;
    const pY = chartStartY + chartHeight - ((d.count / maxIssues) * chartHeight);
    
    // Add small random jitter to Y if it's extremely clustered to avoid perfect overlap? No, Y is count. Wait.
    // If multiple issues at exact same chainage but different rating, they stack or overlap.
    // X is chainage. Y is count. Wait, the mockup Y axis is "No. of Issues".
    // So if a chainage has 5 Rating 1 issues, we plot a point at y=5, color=red.
    
    let color = '#4caf50';
    if (d.rating === 1) color = '#d32f2f';
    else if (d.rating === 5) color = '#ff9800';

    doc.circle(pX, pY, 2).fillColor(color).fill();
  });

  // Axis Labels
  doc.fillColor('#333333').fontSize(8).font('Helvetica').text('Chainage (km)', chartStartX, chartStartY + chartHeight + 15, { width: chartWidth, align: 'center' });
  doc.save();
  doc.rotate(-90, { origin: [startX, startY + chartHeight / 2] });
  doc.text('No. of Issues', startX - 30, startY + chartHeight / 2 + 10, { width: chartHeight, align: 'center' });
  doc.restore();
}

/**
 * Draws a clustered column chart
 */
function drawClusteredColumnChart(doc, startX, startY, width, height, data, legend1, legend2) {
  if (!data || data.length === 0) return;
  const maxVal = Math.max(...data.map(d => Math.max(d.value1, d.value2)), 1);
  const chartHeight = height - 30; // leave room for legend/labels
  const numGroups = data.length;
  const groupWidth = width / numGroups;
  const barWidth = Math.min(20, (groupWidth / 2) - 10);
  
  data.forEach((item, idx) => {
    const groupCenterX = startX + (groupWidth * idx) + (groupWidth / 2);
    
    // Bar 1 (Total Audited)
    const h1 = (item.value1 / maxVal) * chartHeight;
    const x1 = groupCenterX - barWidth - 2;
    const y1 = startY + chartHeight - h1;
    if (h1 > 0) doc.rect(x1, y1, barWidth, h1).fillColor(item.color1).fill();
    doc.fillColor('#333333').fontSize(7).text(item.value1.toString(), x1, y1 - 10, { width: barWidth, align: 'center' });
    
    // Bar 2 (Issues)
    const h2 = (item.value2 / maxVal) * chartHeight;
    const x2 = groupCenterX + 2;
    const y2 = startY + chartHeight - h2;
    if (h2 > 0) doc.rect(x2, y2, barWidth, h2).fillColor(item.color2).fill();
    doc.fillColor('#333333').fontSize(7).text(item.value2.toString(), x2, y2 - 10, { width: barWidth, align: 'center' });
    
    // X Label
    doc.fillColor('#333333').fontSize(8).text(item.label, groupCenterX - 20, startY + chartHeight + 5, { width: 40, align: 'center' });
  });
  
  // Base line
  doc.moveTo(startX, startY + chartHeight).lineTo(startX + width, startY + chartHeight).lineWidth(0.5).strokeColor('#cccccc').stroke();
  
  // Legend
  const legY = startY + height - 5;
  doc.rect(startX + 10, legY, 6, 6).fillColor(data[0].color1).fill();
  doc.fillColor('#666666').fontSize(7).text(legend1, startX + 20, legY);
  doc.rect(startX + 80, legY, 6, 6).fillColor(data[0].color2).fill();
  doc.fillColor('#666666').fontSize(7).text(legend2, startX + 90, legY);
}

/**
 * Draw Section Box
 */
function drawSectionBox(doc, x, y, width, height, title) {
  doc.roundedRect(x, y, width, height, 5).lineWidth(0.5).strokeColor('#d0d7de').stroke();
  if (title) {
    doc.fillColor('#002b5c').fontSize(11).font('Helvetica-Bold').text(title, x + 10, y + 10);
  }
}

/**
 * Draws a Line Chart
 */
function drawLineChart(doc, startX, startY, width, height, data, yLabel = 'Number of Issues') {
  if (!data || data.length === 0) {
    doc.fillColor('#666666').fontSize(10).text('No Data Available', startX + width/2 - 40, startY + height/2);
    return;
  }

  const chartStartX = startX + 30;
  const chartStartY = startY + 20;
  const chartWidth = width - 40;
  const chartHeight = height - 40;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  let yMax = Math.ceil(maxVal * 1.1); // 10% padding
  if (yMax < 5) yMax = 5;

  // Draw Y axis and horizontal gridlines
  doc.lineWidth(0.5).strokeColor('#eeeeee');
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const yVal = Math.round((i / ySteps) * yMax);
    const yPos = chartStartY + chartHeight - ((yVal / yMax) * chartHeight);
    
    // Gridline
    if (i > 0) doc.moveTo(chartStartX, yPos).lineTo(chartStartX + chartWidth, yPos).stroke();
    
    // Label
    doc.fillColor('#666666').fontSize(7).text(yVal.toString(), chartStartX - 25, yPos - 3, { width: 20, align: 'right' });
  }

  // Y-axis line & X-axis line
  doc.lineWidth(1).strokeColor('#999999');
  doc.moveTo(chartStartX, chartStartY).lineTo(chartStartX, chartStartY + chartHeight).stroke(); // Y
  doc.moveTo(chartStartX, chartStartY + chartHeight).lineTo(chartStartX + chartWidth, chartStartY + chartHeight).stroke(); // X

  // Plot Data
  const numPoints = data.length;
  const hPadding = 15; // Small gap from edges to prevent label overlap
  const plotWidth = chartWidth - (2 * hPadding);
  const xStep = numPoints > 1 ? plotWidth / (numPoints - 1) : plotWidth / 2;

  // Draw Line
  doc.lineWidth(2).strokeColor('#1976d2'); // Blue theme
  let first = true;
  data.forEach((d, i) => {
    const pX = numPoints === 1 ? chartStartX + chartWidth / 2 : chartStartX + hPadding + (i * xStep);
    const pY = chartStartY + chartHeight - ((d.value / yMax) * chartHeight);
    if (first) {
      doc.moveTo(pX, pY);
      first = false;
    } else {
      doc.lineTo(pX, pY);
    }
  });
  doc.stroke();

  // Draw points and labels
  const skipLabels = numPoints > 15; // If many points, don't overlap labels
  const labelInterval = skipLabels ? Math.ceil(numPoints / 10) : 1;

  data.forEach((d, i) => {
    const pX = numPoints === 1 ? chartStartX + chartWidth / 2 : chartStartX + hPadding + (i * xStep);
    const pY = chartStartY + chartHeight - ((d.value / yMax) * chartHeight);

    // Marker
    doc.circle(pX, pY, 3).fillColor('#ffffff').strokeColor('#1976d2').lineWidth(1.5).fillAndStroke();

    // Data Label (above the point)
    if (!skipLabels || i % labelInterval === 0 || i === numPoints - 1 || d.value === maxVal) {
      doc.fillColor('#333333').fontSize(7).font('Helvetica-Bold').text(d.value.toString(), pX - 10, pY - 12, { width: 20, align: 'center' });
    }

    // X-axis label
    if (!skipLabels || i % labelInterval === 0 || i === numPoints - 1) {
      let labelText = d.label.replace(' km', ''); // Clean up long labels
      doc.fillColor('#666666').fontSize(7).font('Helvetica').text(labelText, pX - 20, chartStartY + chartHeight + 5, { width: 40, align: 'center' });
    }
  });

  // X-axis Title
  doc.fillColor('#333333').fontSize(8).text('chainage', chartStartX, chartStartY + chartHeight + 25, { width: chartWidth, align: 'center' });

  // Y-axis Title
  doc.save();
  doc.rotate(-90, { origin: [startX, startY + chartHeight / 2] });
  doc.fillColor('#333333').fontSize(8).text(yLabel, startX - 50, startY + chartHeight / 2 - 10, { width: 100, align: 'center' });
  doc.restore();
}

/**
 * Draws a Treemap Chart
 */
function drawTreemap(doc, startX, startY, width, height, data) {
  if (!data || data.length === 0) {
    doc.fillColor('#666666').fontSize(10).text('No Data Available', startX + width/2 - 40, startY + height/2);
    return;
  }

  function sliceAndDice(items, rect) {
      let { x, y, w, h } = rect;
      let remaining = items.reduce((sum, c) => sum + c.value, 0);
      if (remaining === 0) return;
      
      items.forEach(item => {
         const ratio = item.value / remaining;
         if (w > h) {
             const chunkW = w * ratio;
             item.rect = { x, y, w: chunkW, h };
             x += chunkW;
             w -= chunkW;
         } else {
             const chunkH = h * ratio;
             item.rect = { x, y, w, h: chunkH };
             y += chunkH;
             h -= chunkH;
         }
         remaining -= item.value;
      });
  }

  const totalValue = data.reduce((sum, g) => sum + g.value, 0);
  data.sort((a,b) => b.value - a.value);
  data.forEach(g => g.children.sort((a,b) => b.value - a.value));

  const plotHeight = height - 30; // space for legend
  sliceAndDice(data, { x: startX, y: startY, w: width, h: plotHeight });
  
  data.forEach(group => {
     let crect = { ...group.rect };
     let drawGroupTitle = false;
     if (crect.h > 35 && crect.w > 40) {
         drawGroupTitle = true;
         crect.y += 14;
         crect.h -= 14;
     }
     sliceAndDice(group.children, crect);
     
     const groupParamTotal = group.children.reduce((sum, c) => sum + c.value, 0);
     
     group.children.forEach(child => {
         if (child.rect.w > 1 && child.rect.h > 1) {
             doc.lineWidth(1).rect(child.rect.x, child.rect.y, child.rect.w, child.rect.h)
                .fillAndStroke(group.color, '#ffffff');
             
             doc.fillColor('#ffffff').fontSize(7).font('Helvetica');
             if (child.rect.w > 15 && child.rect.h > 10) {
                 const pct = groupParamTotal > 0 ? ((child.value / groupParamTotal) * 100).toFixed(1) : 0;
                 const label = `${child.name} (${pct}%)`;
                 doc.text(label, child.rect.x + 2, child.rect.y + 3, {
                     width: child.rect.w - 4,
                     height: child.rect.h - 4,
                     ellipsis: true
                 });
             }
         }
     });
     
     if (drawGroupTitle) {
         doc.lineWidth(1).rect(group.rect.x, group.rect.y, group.rect.w, 14).fillAndStroke(group.color, '#ffffff');
         doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
         if (group.rect.w > 20) {
             doc.text(group.name, group.rect.x + 3, group.rect.y + 3, { 
                 width: group.rect.w - 6, 
                 height: 10, 
                 ellipsis: true, 
                 lineBreak: false 
             });
         }
     }
  });

  // Legend
  let legY = startY + plotHeight + 10;
  let legX = startX;
  data.forEach(group => {
     const pct = totalValue > 0 ? ((group.value / totalValue) * 100).toFixed(1) : 0;
     const legendLabel = `${group.name} (${pct}%)`;
     const legW = doc.fontSize(7).font('Helvetica').widthOfString(legendLabel) + 15;
     if (legX + legW > startX + width) {
         legX = startX; 
         legY += 12; // Move to the next line
     }
     doc.rect(legX, legY, 8, 8).fill(group.color);
     doc.fillColor('#333333').text(legendLabel, legX + 12, legY + 1);
     legX += legW + 10;
  });
}

module.exports = {
  drawDonutChart,
  drawHorizontalBarChart,
  drawParetoChart,
  drawScatterPlot,
  drawSimpleLegend,
  drawSectionBox,
  drawClusteredColumnChart,
  drawLineChart,
  drawTreemap
};
