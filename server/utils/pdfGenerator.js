import puppeteer from 'puppeteer';

export const generateLessonPlanPDF = async (plan) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          color: #4F46E5;
          margin: 0;
          font-size: 28px;
        }
        .meta-info {
          display: flex;
          gap: 30px;
          margin-top: 15px;
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          color: #4F46E5;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          border-left: 4px solid #4F46E5;
          padding-left: 10px;
        }
        .objectives-list, .materials-list, .activities-list {
          list-style-type: disc;
          margin-left: 20px;
          margin-top: 10px;
        }
        .objectives-list li, .materials-list li, .activities-list li {
          margin-bottom: 8px;
        }
        .lesson-flow {
          background-color: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .flow-section {
          margin-bottom: 15px;
        }
        .flow-section-title {
          font-weight: bold;
          color: #1F2937;
          margin-bottom: 8px;
        }
        .assessment-box, .homework-box {
          background-color: #EEF2FF;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #6366F1;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${plan.title}</h1>
        <div class="meta-info">
          <span><strong>Subject:</strong> ${plan.subject}</span>
          ${plan.topic ? `<span><strong>Topic:</strong> ${plan.topic}</span>` : ''}
          <span><strong>Grade:</strong> ${plan.grade}</span>
          ${plan.duration ? `<span><strong>Duration:</strong> ${plan.duration} minutes</span>` : ''}
        </div>
      </div>

      ${plan.content.learningObjectives ? `
        <div class="section">
          <div class="section-title">Learning Objectives</div>
          <ul class="objectives-list">
            ${Array.isArray(plan.content.learningObjectives) 
              ? plan.content.learningObjectives.map(obj => `<li>${obj}</li>`).join('')
              : `<li>${plan.content.learningObjectives}</li>`}
          </ul>
        </div>
      ` : ''}

      ${plan.content.materialsRequired ? `
        <div class="section">
          <div class="section-title">Materials Required</div>
          <ul class="materials-list">
            ${Array.isArray(plan.content.materialsRequired)
              ? plan.content.materialsRequired.map(mat => `<li>${mat}</li>`).join('')
              : `<li>${plan.content.materialsRequired}</li>`}
          </ul>
        </div>
      ` : ''}

      ${plan.content.lessonFlow ? `
        <div class="section">
          <div class="section-title">Lesson Flow</div>
          <div class="lesson-flow">
            ${plan.content.lessonFlow.introduction ? `
              <div class="flow-section">
                <div class="flow-section-title">Introduction:</div>
                <div>${plan.content.lessonFlow.introduction}</div>
              </div>
            ` : ''}
            ${plan.content.lessonFlow.activities ? `
              <div class="flow-section">
                <div class="flow-section-title">Activities:</div>
                <ul class="activities-list">
                  ${Array.isArray(plan.content.lessonFlow.activities)
                    ? plan.content.lessonFlow.activities.map(act => `<li>${act}</li>`).join('')
                    : `<li>${plan.content.lessonFlow.activities}</li>`}
                </ul>
              </div>
            ` : ''}
            ${plan.content.lessonFlow.wrapUp ? `
              <div class="flow-section">
                <div class="flow-section-title">Wrap-up:</div>
                <div>${plan.content.lessonFlow.wrapUp}</div>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${plan.content.assessment ? `
        <div class="section">
          <div class="section-title">Assessment</div>
          <div class="assessment-box">${plan.content.assessment}</div>
        </div>
      ` : ''}

      ${plan.content.homework ? `
        <div class="section">
          <div class="section-title">Homework</div>
          <div class="homework-box">${plan.content.homework}</div>
        </div>
      ` : ''}

      ${plan.content.summary ? `
        <div class="section">
          <div class="section-title">Summary</div>
          <div>${plan.content.summary}</div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Version ${plan.version}</p>
        <p>Created by: ${plan.creator?.name || 'Unknown'}</p>
      </div>
    </body>
    </html>
  `;

  let browser;
  try {
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    
    // Use system chromium if available (Docker), otherwise let Puppeteer use its bundled version
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true
    });
    await browser.close();
    return pdf;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
};



