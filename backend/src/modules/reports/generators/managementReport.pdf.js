'use strict';

const PDFDocument = require('pdfkit-table');
const { drawDonutChart, drawHorizontalBarChart, drawSectionBox } = require('../utils/pdfChart.util');

class ManagementReportGenerator {

  /**
   * Generate a complete Management Report PDF from the Performance Center data.
   * Streams directly to the Express response object.
   */
  async generate(data, res) {
    const PAGE_MARGINS = { top: 80, bottom: 50, left: 50, right: 50 };
    const doc = new PDFDocument({ margins: PAGE_MARGINS, size: 'A4' });
    doc.on('error', err => console.error('Management PDF Error:', err));
    doc.pipe(res);

    // Theme
    const PRIMARY = '#1E3A8A';
    const SECONDARY = '#0F172A';
    const TEXT = '#374151';
    const LIGHT_BG = '#F8FAFC';
    const GREEN = '#059669';
    const AMBER = '#D97706';
    const RED = '#DC2626';
    const BORDER = '#E2E8F0';

    let pageCount = 0;

    const drawHeaderFooter = (pageDoc) => {
      const w = pageDoc.page.width;
      const h = pageDoc.page.height;
      const m = pageDoc.page.margins;
      const oldT = m.top;
      const oldB = m.bottom;
      m.top = 0;
      m.bottom = 0;

      pageDoc.save();
      // Header
      pageDoc.rect(0, 0, w, 60).fill(PRIMARY);
      pageDoc.fillColor('white').fontSize(13).font('Helvetica-Bold')
        .text('HiRATE — Road Asset Performance & Decision Report', m.left || 50, 15, { width: w - 100, lineBreak: false });
      pageDoc.fontSize(9).font('Helvetica').fillColor('#CBD5E1')
        .text(`Project: ${data.overview.projectName}`, m.left || 50, 35, { width: w - 100, lineBreak: false });
      pageDoc.restore();

      // Footer
      pageDoc.save();
      pageDoc.rect(0, h - 30, w, 30).fill('#F1F5F9');
      pageDoc.fillColor(TEXT).fontSize(7).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} | HiRATE Asset Management System`, 50, h - 18, { lineBreak: false });
      pageDoc.text(`Page ${pageCount}`, 50, h - 18, { align: 'right', width: w - 100, lineBreak: false });
      pageDoc.restore();

      m.top = oldT;
      m.bottom = oldB;
    };

    doc.on('pageAdded', () => {
      pageCount++;
      drawHeaderFooter(doc);
      doc.y = PAGE_MARGINS.top;
    });

    // ─── PAGE 1: EXECUTIVE COVER ──────────────────────────────────────────────

    pageCount++;
    // Cover page — no standard header, custom design
    const w = doc.page.width;
    const h = doc.page.height;

    // Full cover background
    doc.rect(0, 0, w, h).fill(PRIMARY);

    // Title area
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
      .text('Road Asset Performance', 60, 180, { width: w - 120 });
    doc.fontSize(28).text('& Decision Report', 60, 220, { width: w - 120 });

    doc.moveDown(1.5);
    doc.fontSize(11).font('Helvetica').fillColor('#94A3B8')
      .text('Generated from HiRATE Inspection Data', 60, doc.y, { width: w - 120 });

    // Project details box
    const boxY = 340;
    doc.roundedRect(60, boxY, w - 120, 180, 8).fill('#1E40AF');

    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    const labelX = 80;
    const valX = 220;
    let row = boxY + 20;

    const coverFields = [
      ['Project', data.overview.projectName],
      ['Inspection Cycle', data.overview.cycleName],
      ['Inspection Date', data.overview.inspectionDateRange],
      ['Total Assets Analyzed', data.overview.totalAssets.toLocaleString()],
      ['Total Ratings', data.overview.totalRatings.toLocaleString()],
      ['Average Rating', `${data.overview.averageRating} / 10`],
      ['Critical Issues', data.overview.criticalIssues.toString()]
    ];

    coverFields.forEach(([label, value]) => {
      doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(label, labelX, row, { lineBreak: false });
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text(value || 'N/A', valX, row, { width: w - valX - 80, lineBreak: false });
      row += 22;
    });

    // Footer on cover
    doc.fillColor('#64748B').fontSize(8).font('Helvetica')
      .text(`Report generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, 60, h - 60, { width: w - 120, align: 'center' });

    // ─── PAGE 2: CURRENT PERFORMANCE SNAPSHOT ─────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'CURRENT PERFORMANCE SNAPSHOT', PRIMARY);
    doc.moveDown(0.5);

    // KPI Grid
    const kpis = [
      { label: 'Total Assets', value: data.overview.totalAssets.toLocaleString(), color: PRIMARY },
      { label: 'Rated Assets', value: data.overview.ratedAssets.toLocaleString(), color: PRIMARY },
      { label: 'Average Rating', value: `${data.overview.averageRating}`, color: GREEN },
      { label: 'Critical Issues', value: data.overview.criticalIssues.toString(), color: RED },
      { label: 'Image Coverage', value: `${data.overview.imageCoverage}%`, color: AMBER },
      { label: 'Unique Chainages', value: data.overview.uniqueChainages.toLocaleString(), color: PRIMARY }
    ];

    const kpiStartY = doc.y;
    const kpiW = 150;
    const kpiH = 60;
    const kpiGap = 12;
    const kpiPerRow = 3;

    kpis.forEach((kpi, i) => {
      const col = i % kpiPerRow;
      const rowIdx = Math.floor(i / kpiPerRow);
      const x = 50 + col * (kpiW + kpiGap);
      const y = kpiStartY + rowIdx * (kpiH + kpiGap);

      doc.roundedRect(x, y, kpiW, kpiH, 6).fill(LIGHT_BG);
      doc.roundedRect(x, y, 4, kpiH, 2).fill(kpi.color);
      doc.fillColor(kpi.color).fontSize(18).font('Helvetica-Bold')
        .text(kpi.value, x + 14, y + 12, { width: kpiW - 24, lineBreak: false });
      doc.fillColor(TEXT).fontSize(8).font('Helvetica')
        .text(kpi.label, x + 14, y + 38, { width: kpiW - 24, lineBreak: false });
    });

    doc.y = kpiStartY + Math.ceil(kpis.length / kpiPerRow) * (kpiH + kpiGap) + 20;

    // Condition Profile Summary
    this.drawSectionTitle(doc, 'CONDITION PROFILE', PRIMARY);
    doc.moveDown(0.3);

    const cond = data.condition;

    // Donut chart
    const donutData = [
      { value: cond.good.count, color: GREEN, label: `Good (${cond.good.percentage}%)` },
      { value: cond.moderate.count, color: AMBER, label: `Moderate (${cond.moderate.percentage}%)` },
      { value: cond.critical.count, color: RED, label: `Critical (${cond.critical.percentage}%)` }
    ];

    const donutCenterX = 160;
    const donutY = doc.y + 60;
    drawDonutChart(doc, donutCenterX, donutY, 50, 20, donutData, 'Avg Rating', cond.averageRating, donutCenterX + 80, donutY - 30);

    doc.y = donutY + 80;

    // ─── PAGE 3: ASSET PERFORMANCE ────────────────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'ASSET PERFORMANCE', PRIMARY);
    doc.moveDown(0.3);

    const assetData = data.assetPerformance.assets;

    if (assetData.length > 0) {
      // Table
      const tableHeaders = ['Asset Type', 'Total Ratings', 'Avg Rating', 'Issues', 'Critical'];
      const colWidths = [160, 80, 80, 70, 70];
      let tableY = doc.y;

      // Header row
      let tx = 50;
      doc.rect(50, tableY, colWidths.reduce((a, b) => a + b, 0), 20).fill(PRIMARY);
      tableHeaders.forEach((header, i) => {
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
          .text(header, tx + 4, tableY + 5, { width: colWidths[i] - 8, lineBreak: false });
        tx += colWidths[i];
      });
      tableY += 20;

      // Data rows
      assetData.slice(0, 15).forEach((asset, idx) => {
        tx = 50;
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : LIGHT_BG;
        doc.rect(50, tableY, colWidths.reduce((a, b) => a + b, 0), 18).fill(rowBg);

        const values = [asset.assetType, asset.totalRatings.toString(), asset.avgRating, asset.issues.toString(), asset.critical.toString()];
        values.forEach((val, i) => {
          let textColor = TEXT;
          if (i === 2) {
            const rating = parseFloat(val);
            if (rating >= 8) textColor = GREEN;
            else if (rating >= 4) textColor = AMBER;
            else textColor = RED;
          }
          if (i === 4 && parseInt(val) > 0) textColor = RED;

          doc.fillColor(textColor).fontSize(8).font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
            .text(val, tx + 4, tableY + 4, { width: colWidths[i] - 8, lineBreak: false });
          tx += colWidths[i];
        });
        tableY += 18;
      });

      doc.y = tableY + 15;

      // Horizontal bar chart for top 10 assets by issues
      if (doc.y < 600) {
        const totalIssues = data.issueIntelligence.totalIssues || 1;
        const barData = assetData
          .filter(a => a.issues > 0)
          .slice(0, 8)
          .map(a => ({ label: a.assetType.substring(0, 25), percentage: (a.issues / totalIssues) * 100 }));

        if (barData.length > 0) {
          drawSectionBox(doc, 50, doc.y, 460, 180, 'Issues by Asset Type');
          drawHorizontalBarChart(doc, 60, doc.y + 25, 440, 145, barData);
          doc.y += 195;
        }
      }
    } else {
      doc.fillColor(TEXT).fontSize(10).text('No asset performance data available.', 50, doc.y);
    }

    // ─── PAGE 4: ISSUE INTELLIGENCE ───────────────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'ISSUE INTELLIGENCE', PRIMARY);
    doc.moveDown(0.3);

    const issues = data.issueIntelligence;

    // Issue KPIs
    const issueKpis = [
      { label: 'Total Issues', value: issues.totalIssues.toString(), color: AMBER },
      { label: 'Critical', value: issues.criticalIssues.toString(), color: RED },
      { label: 'Observations', value: issues.observationIssues.toString(), color: AMBER }
    ];

    let ikY = doc.y;
    issueKpis.forEach((kpi, i) => {
      const x = 50 + i * 162;
      doc.roundedRect(x, ikY, 150, 45, 6).fill(LIGHT_BG);
      doc.roundedRect(x, ikY, 4, 45, 2).fill(kpi.color);
      doc.fillColor(kpi.color).fontSize(16).font('Helvetica-Bold')
        .text(kpi.value, x + 14, ikY + 8, { width: 130, lineBreak: false });
      doc.fillColor(TEXT).fontSize(8).font('Helvetica')
        .text(kpi.label, x + 14, ikY + 28, { width: 130, lineBreak: false });
    });

    doc.y = ikY + 60;

    // Top issues by category
    if (issues.byCategory.length > 0) {
      this.drawSubsectionTitle(doc, 'Top Issue Categories');
      let catY = doc.y;
      issues.byCategory.slice(0, 10).forEach((cat, i) => {
        doc.fillColor(TEXT).fontSize(8).font('Helvetica-Bold')
          .text(`${i + 1}. ${cat.name}`, 60, catY, { width: 200, lineBreak: false });
        doc.fillColor(TEXT).fontSize(8).font('Helvetica')
          .text(`${cat.total} issues (${cat.critical} critical)`, 270, catY, { width: 200, lineBreak: false });
        catY += 14;
      });
      doc.y = catY + 10;
    }

    // Top issues by parameter
    if (issues.byParameter.length > 0) {
      this.drawSubsectionTitle(doc, 'Top Issue Parameters');
      let paramY = doc.y;
      issues.byParameter.slice(0, 10).forEach((param, i) => {
        doc.fillColor(TEXT).fontSize(8).font('Helvetica-Bold')
          .text(`${i + 1}. ${param.name}`, 60, paramY, { width: 200, lineBreak: false });
        doc.fillColor(TEXT).fontSize(8).font('Helvetica')
          .text(`${param.total} issues`, 270, paramY, { width: 200, lineBreak: false });
        paramY += 14;
      });
      doc.y = paramY + 10;
    }

    // ─── PAGE 5: RISK & CRITICALITY ───────────────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'RISK & CRITICALITY', PRIMARY);
    doc.moveDown(0.3);

    const riskData = data.risk;

    doc.fillColor(TEXT).fontSize(9).font('Helvetica')
      .text(`${riskData.totalCritical} critical observations identified. The following are sorted by severity and chainage.`, 50, doc.y, { width: 460 });
    doc.moveDown(0.5);

    // Critical parameters
    if (riskData.criticalParameters.length > 0) {
      this.drawSubsectionTitle(doc, 'Critical Parameters');
      riskData.criticalParameters.slice(0, 8).forEach((p, i) => {
        doc.fillColor(RED).fontSize(8).font('Helvetica-Bold')
          .text(`${p.name}: ${p.count} critical`, 60, doc.y, { width: 400, lineBreak: false });
        doc.moveDown(0.3);
      });
      doc.moveDown(0.5);
    }

    // Critical chainages
    if (riskData.criticalChainages.length > 0) {
      this.drawSubsectionTitle(doc, 'Critical Chainage Locations');
      riskData.criticalChainages.slice(0, 8).forEach(ch => {
        doc.fillColor(RED).fontSize(8).font('Helvetica-Bold')
          .text(`Chainage ${ch.chainage} km`, 60, doc.y, { width: 150, lineBreak: false });
        doc.fillColor(TEXT).fontSize(8).font('Helvetica')
          .text(`${ch.count} critical observations`, 220, doc.y, { width: 200, lineBreak: false });
        doc.moveDown(0.4);
      });
      doc.moveDown(0.5);
    }

    // Critical assets table
    if (riskData.criticalAssets.length > 0) {
      this.drawSubsectionTitle(doc, 'Critical Asset Categories');
      riskData.criticalAssets.slice(0, 10).forEach((a, i) => {
        doc.fillColor(TEXT).fontSize(8).font('Helvetica-Bold')
          .text(a.name, 60, doc.y, { width: 150, lineBreak: false });
        doc.fillColor(TEXT).fontSize(8).font('Helvetica')
          .text(`${a.critical} critical, ${a.observation} observations (${a.issueRate}% issue rate)`, 220, doc.y, { width: 280, lineBreak: false });
        doc.moveDown(0.4);
      });
    }

    // ─── PAGE 6: CORRIDOR / CHAINAGE ──────────────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'CORRIDOR / CHAINAGE INTELLIGENCE', PRIMARY);
    doc.moveDown(0.3);

    const hotspotData = data.hotspots;

    doc.fillColor(TEXT).fontSize(9).font('Helvetica')
      .text(`Chainage span: ${hotspotData.minChainage} km to ${hotspotData.maxChainage} km (${hotspotData.totalChainageSpan} km)`, 50, doc.y, { width: 460 });
    doc.moveDown(0.8);

    // Hotspot table
    if (hotspotData.hotspots.length > 0) {
      this.drawSubsectionTitle(doc, 'Top Chainage Hotspots');

      const hsHeaders = ['Chainage Range', 'Issues', 'Critical', 'Avg Rating'];
      const hsWidths = [180, 80, 80, 80];
      let hsY = doc.y;
      let hx = 50;

      doc.rect(50, hsY, hsWidths.reduce((a, b) => a + b, 0), 18).fill(PRIMARY);
      hsHeaders.forEach((header, i) => {
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
          .text(header, hx + 4, hsY + 4, { width: hsWidths[i] - 8, lineBreak: false });
        hx += hsWidths[i];
      });
      hsY += 18;

      hotspotData.hotspots.forEach((hs, idx) => {
        hx = 50;
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : LIGHT_BG;
        doc.rect(50, hsY, hsWidths.reduce((a, b) => a + b, 0), 16).fill(rowBg);

        const vals = [hs.chainageRange, hs.issues.toString(), hs.critical.toString(), hs.avgRating.toString()];
        vals.forEach((val, i) => {
          doc.fillColor(TEXT).fontSize(8).font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
            .text(val, hx + 4, hsY + 3, { width: hsWidths[i] - 8, lineBreak: false });
          hx += hsWidths[i];
        });
        hsY += 16;
      });

      doc.y = hsY + 15;
    }

    // ─── PAGE 7: INSPECTION COVERAGE ──────────────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'INSPECTION COVERAGE & DATA QUALITY', PRIMARY);
    doc.moveDown(0.3);

    const cov = data.coverage;

    const coverageItems = [
      { label: 'Rating Coverage', value: `${cov.ratingCoverage}%`, detail: `${cov.ratedRecords} of ${cov.totalRecords} records`, pct: parseFloat(cov.ratingCoverage) },
      { label: 'Image Coverage', value: `${cov.imageCoverage}%`, detail: `${cov.imagesAvailable} of ${cov.totalRecords} records`, pct: parseFloat(cov.imageCoverage) },
      { label: 'Completion Rate', value: `${cov.completionRate}%`, detail: `${cov.completedTasks} of ${cov.totalRecords} tasks`, pct: parseFloat(cov.completionRate) }
    ];

    let covY = doc.y;
    coverageItems.forEach(item => {
      // Label
      doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold')
        .text(item.label, 60, covY, { width: 200, lineBreak: false });
      doc.fillColor(TEXT).fontSize(8).font('Helvetica')
        .text(item.detail, 60, covY + 14, { width: 200, lineBreak: false });

      // Progress bar
      const barX = 260;
      const barW = 200;
      const barH = 12;
      doc.roundedRect(barX, covY + 4, barW, barH, 4).fill('#E2E8F0');
      const fillW = Math.max((item.pct / 100) * barW, 2);
      const barColor = item.pct >= 90 ? GREEN : item.pct >= 70 ? AMBER : RED;
      doc.roundedRect(barX, covY + 4, fillW, barH, 4).fill(barColor);

      // Value
      doc.fillColor(TEXT).fontSize(10).font('Helvetica-Bold')
        .text(item.value, barX + barW + 10, covY + 3, { width: 50, lineBreak: false });

      covY += 40;
    });

    doc.y = covY + 20;

    // Status breakdown
    if (cov.statusBreakdown && Object.keys(cov.statusBreakdown).length > 0) {
      this.drawSubsectionTitle(doc, 'Task Status Breakdown');
      Object.entries(cov.statusBreakdown).forEach(([status, count]) => {
        doc.fillColor(TEXT).fontSize(8).font('Helvetica')
          .text(`${status}: ${count}`, 60, doc.y, { width: 300, lineBreak: false });
        doc.moveDown(0.3);
      });
    }

    // ─── PAGE 8+: EVIDENCE ─────────────────────────────────────────────────────

    if (data.evidence.items.length > 0) {
      doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

      this.drawSectionTitle(doc, 'CURRENT INSPECTION EVIDENCE', PRIMARY);
      doc.moveDown(0.3);

      doc.fillColor(TEXT).fontSize(9).font('Helvetica')
        .text(`Showing ${data.evidence.items.length} critical and noteworthy observations with available image evidence.`, 50, doc.y, { width: 460 });
      doc.moveDown(0.5);

      for (const item of data.evidence.items) {
        if (doc.y > 650) {
          doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });
        }

        // Evidence card
        const cardY = doc.y;
        doc.roundedRect(50, cardY, 460, 80, 6).fill(LIGHT_BG).stroke(BORDER);

        doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
          .text(`Chainage ${item.chainage.toFixed(2)} km`, 60, cardY + 8, { width: 200, lineBreak: false });
        doc.fillColor(item.score === 1 ? RED : AMBER).fontSize(8).font('Helvetica-Bold')
          .text(item.score === 1 ? 'CRITICAL' : 'OBSERVATION', 380, cardY + 8, { width: 120, lineBreak: false });

        doc.fillColor(TEXT).fontSize(8).font('Helvetica');
        doc.text(`Asset: ${item.assetType}`, 60, cardY + 24, { width: 200, lineBreak: false });
        doc.text(`Parameter: ${item.parameter}`, 60, cardY + 38, { width: 200, lineBreak: false });
        doc.text(`Rating: ${item.score} / 10`, 60, cardY + 52, { width: 200, lineBreak: false });
        doc.text(`Direction: ${item.direction}`, 290, cardY + 24, { width: 200, lineBreak: false });
        doc.text(`Remark: ${item.remark || 'No remark'}`, 290, cardY + 38, { width: 200, lineBreak: false });

        if (item.imageUrl) {
          doc.fillColor('#2563EB').fontSize(7).font('Helvetica')
            .text('Image available in digital report', 290, cardY + 52, { width: 200, lineBreak: false });
        } else {
          doc.fillColor('#9CA3AF').fontSize(7).font('Helvetica')
            .text('Image Evidence Unavailable', 290, cardY + 52, { width: 200, lineBreak: false });
        }

        doc.y = cardY + 90;
      }
    }

    // ─── FINAL PAGE: MANAGEMENT SUMMARY ───────────────────────────────────────

    doc.addPage({ margins: PAGE_MARGINS, size: 'A4' });

    this.drawSectionTitle(doc, 'MANAGEMENT SUMMARY', PRIMARY);
    doc.moveDown(0.5);

    const summary = data.managementSummary;

    const summaryItems = [
      { heading: 'PROJECT CONDITION', text: summary.projectCondition },
      { heading: 'ISSUE PROFILE', text: summary.issueProfile },
      { heading: 'CRITICAL CONDITION', text: summary.criticalCondition },
      { heading: 'CONDITION BREAKDOWN', text: summary.conditionBreakdown },
      { heading: 'PRIMARY ISSUE AREA', text: summary.primaryIssueArea },
      { heading: 'PRIMARY ISSUE PARAMETER', text: summary.primaryIssueParameter },
      { heading: 'MAJOR HOTSPOT', text: `${summary.majorHotspot} (${summary.majorHotspotIssues} issues)` },
      { heading: 'IMAGE COVERAGE', text: summary.imageCoverage },
      { heading: 'RATING COVERAGE', text: summary.ratingCoverage },
      { heading: 'TOTAL ASSETS ANALYZED', text: summary.totalAssetsAnalyzed.toLocaleString() },
      { heading: 'TOTAL RATINGS ANALYZED', text: summary.totalRatingsAnalyzed.toLocaleString() }
    ];

    summaryItems.forEach(item => {
      doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
        .text(item.heading, 60, doc.y, { width: 440 });
      doc.fillColor(TEXT).fontSize(9).font('Helvetica')
        .text(item.text, 60, doc.y, { width: 440 });
      doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // Report Metadata
    doc.fillColor(BORDER).fontSize(1);
    doc.moveTo(50, doc.y).lineTo(500, doc.y).lineWidth(1).strokeColor(BORDER).stroke();
    doc.moveDown(0.5);

    this.drawSubsectionTitle(doc, 'Report Metadata');

    const metaItems = [
      ['Project', data.metadata.project],
      ['Inspection Cycle', data.metadata.cycleName],
      ['Road Type', data.metadata.roadType],
      ['Direction', data.metadata.direction],
      ['Asset Filter', data.metadata.assetType],
      ['Parameter Filter', data.metadata.parameter],
      ['Generated At', data.metadata.generatedAt],
      ['Total Records Analyzed', data.metadata.totalRecordsAnalyzed.toLocaleString()],
      ['Data Source', data.metadata.dataSource],
      ['Rating Scale', '1 (Critical) — 5 (Observation) — 10 (Good)']
    ];

    metaItems.forEach(([label, value]) => {
      doc.fillColor('#6B7280').fontSize(7).font('Helvetica')
        .text(`${label}: ${value}`, 60, doc.y, { width: 440 });
      doc.moveDown(0.15);
    });

    doc.end();
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  drawSectionTitle(doc, title, color = '#1E3A8A') {
    doc.fillColor(color).fontSize(14).font('Helvetica-Bold').text(title, 50, doc.y, { width: 460 });
    doc.moveDown(0.15);
    doc.moveTo(50, doc.y).lineTo(510, doc.y).lineWidth(2).strokeColor(color).stroke();
    doc.moveDown(0.3);
  }

  drawSubsectionTitle(doc, title) {
    doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text(title, 60, doc.y, { width: 440 });
    doc.moveDown(0.3);
  }
}

module.exports = new ManagementReportGenerator();
