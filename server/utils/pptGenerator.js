import PptxGenJS from 'pptxgenjs';

// Color scheme for the presentation
const colors = {
  primary: '4F46E5',      // Indigo
  secondary: '06B6D4',    // Cyan
  accent: 'F59E0B',       // Amber
  success: '10B981',      // Green
  dark: '1F2937',         // Dark gray
  light: 'F3F4F6',        // Light gray
  white: 'FFFFFF'
};

// Helper function to add header with background
const addHeader = (slide, title, bgColor = colors.primary, textColor = colors.white, yPosition = 0.3) => {
  // Add colored background rectangle
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: yPosition,
    w: 10,
    h: 0.8,
    fill: { color: bgColor }
  });
  
  // Add title text
  slide.addText(title, {
    x: 0.5,
    y: yPosition,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: textColor,
    align: 'left',
    valign: 'middle'
  });
};

// Helper function to add content box
const addContentBox = (slide, yStart, content, backgroundColor = colors.light) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.3,
    y: yStart,
    w: 9.4,
    h: 0.06,
    fill: { color: colors.secondary }
  });
  
  slide.addText(content, {
    x: 0.5,
    y: yStart + 0.15,
    w: 9,
    h: 4,
    fontSize: 16,
    color: colors.dark,
    align: 'left',
    valign: 'top'
  });
};

let pptx;

export const generateLessonPlanPPT = (plan) => {
  pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.author = plan.creator?.name || 'Edvance';
  pptx.company = 'Edvance';
  pptx.title = plan.title;
  pptx.subject = plan.subject;
  pptx.defineLayout({ name: 'TITLE', master: 'MASTER' });

  // Slide 1: Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.primary };
  
  // Add decorative shape
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 7.5,
    fill: { color: colors.primary }
  });
  
  // Add secondary accent shape
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 4,
    w: 10,
    h: 3.5,
    fill: { color: colors.secondary },
    transparency: 20
  });
  
  // Add main title with shadow effect (simulated with offset text)
  titleSlide.addText(plan.title, {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1.5,
    fontSize: 54,
    bold: true,
    color: colors.white,
    align: 'center',
    valign: 'middle'
  });
  
  // Add subject and grade info
  titleSlide.addText(`${plan.subject} • Grade ${plan.grade}`, {
    x: 0.5,
    y: 3.8,
    w: 9,
    h: 0.6,
    fontSize: 28,
    color: colors.white,
    align: 'center',
    bold: true
  });
  
  if (plan.topic) {
    titleSlide.addText(plan.topic, {
      x: 0.5,
      y: 4.6,
      w: 9,
      h: 0.5,
      fontSize: 22,
      color: colors.dark,
      align: 'center',
      italic: true
    });
  }
  
  // Add footer
  titleSlide.addText(`Created with Edvance • ${new Date().toLocaleDateString()}`, {
    x: 0.5,
    y: 6.8,
    w: 9,
    h: 0.4,
    fontSize: 12,
    color: colors.white,
    align: 'center'
  });
  
  // Add decorative circles
  titleSlide.addShape(pptx.ShapeType.ellipse, {
    x: 8.5,
    y: 0.3,
    w: 1.2,
    h: 1.2,
    fill: { color: colors.accent },
    transparency: 30,
    line: { color: colors.white, width: 2 }
  });
  
  titleSlide.addShape(pptx.ShapeType.ellipse, {
    x: 0.3,
    y: 5.8,
    w: 0.8,
    h: 0.8,
    fill: { color: colors.success },
    transparency: 30,
    line: { color: colors.white, width: 2 }
  });

  // Slide 2: Learning Objectives
  if (plan.content.learningObjectives) {
    const objectivesSlide = pptx.addSlide();
    objectivesSlide.background = { color: colors.white };
    
    // Add header
    addHeader(objectivesSlide, '📚 Learning Objectives', colors.success);
    
    const objectives = Array.isArray(plan.content.learningObjectives) 
      ? plan.content.learningObjectives 
      : [plan.content.learningObjectives];
    
    objectives.forEach((obj, index) => {
      // Add background box for each objective
      objectivesSlide.addShape(pptx.ShapeType.rect, {
        x: 0.4,
        y: 1.3 + (index * 1),
        w: 9.2,
        h: 0.85,
        fill: { color: index % 2 === 0 ? colors.light : colors.white },
        line: { color: colors.secondary, width: 1 }
      });
      
      objectivesSlide.addText(`${index + 1}. ${obj}`, {
        x: 0.7,
        y: 1.35 + (index * 1),
        w: 8.6,
        h: 0.75,
        fontSize: 14,
        color: colors.dark,
        valign: 'middle'
      });
    });
  }

  // Slide 3: Materials Required
  if (plan.content.materialsRequired) {
    const materialsSlide = pptx.addSlide();
    materialsSlide.background = { color: colors.white };
    
    addHeader(materialsSlide, '🧪 Materials Required', colors.accent);
    
    const materials = Array.isArray(plan.content.materialsRequired)
      ? plan.content.materialsRequired
      : [plan.content.materialsRequired];
    
    materials.forEach((mat, index) => {
      // Add colored circle for bullet point
      materialsSlide.addShape(pptx.ShapeType.ellipse, {
        x: 0.6,
        y: 1.35 + (index * 0.95),
        w: 0.25,
        h: 0.25,
        fill: { color: colors.accent }
      });
      
      materialsSlide.addText(mat, {
        x: 1.1,
        y: 1.3 + (index * 0.95),
        w: 8.4,
        h: 0.6,
        fontSize: 14,
        color: colors.dark,
        valign: 'top'
      });
    });
  }

  // Slide 4: Introduction
  if (plan.content.lessonFlow?.introduction) {
    const introSlide = pptx.addSlide();
    introSlide.background = { color: colors.white };
    
    addHeader(introSlide, '👋 Introduction', colors.primary);
    
    // Add background content area
    introSlide.addShape(pptx.ShapeType.rect, {
      x: 0.4,
      y: 1.3,
      w: 9.2,
      h: 5.5,
      fill: { color: colors.light },
      line: { color: colors.secondary, width: 2 }
    });
    
    introSlide.addText(plan.content.lessonFlow.introduction, {
      x: 0.7,
      y: 1.5,
      w: 8.6,
      h: 5.1,
      fontSize: 16,
      color: colors.dark,
      align: 'left',
      valign: 'top'
    });
  }

  // Slide 5: Activities
  if (plan.content.lessonFlow?.activities) {
    const activities = Array.isArray(plan.content.lessonFlow.activities)
      ? plan.content.lessonFlow.activities
      : [plan.content.lessonFlow.activities];
    
    // First slide of activities
    const activitiesSlide = pptx.addSlide();
    activitiesSlide.background = { color: colors.white };
    
    addHeader(activitiesSlide, '🎯 Activities', colors.secondary);
    
    const activitiesPerSlide = 5;
    activities.slice(0, activitiesPerSlide).forEach((act, index) => {
      // Add colored box with gradient effect
      const boxColors = [colors.primary, colors.secondary, colors.accent, colors.success, '#8B5CF6'];
      activitiesSlide.addShape(pptx.ShapeType.rect, {
        x: 0.4,
        y: 1.2 + (index * 1.1),
        w: 9.2,
        h: 1,
        fill: { color: boxColors[index % boxColors.length] },
        transparency: 10
      });
      
      activitiesSlide.addText(`${index + 1}`, {
        x: 0.6,
        y: 1.3 + (index * 1.1),
        w: 0.6,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: colors.white,
        align: 'center',
        valign: 'middle'
      });
      
      activitiesSlide.addText(act, {
        x: 1.4,
        y: 1.25 + (index * 1.1),
        w: 8.2,
        h: 0.9,
        fontSize: 14,
        color: colors.dark,
        valign: 'middle'
      });
    });
    
    // If more than 5 activities, create additional slides
    if (activities.length > activitiesPerSlide) {
      const moreActivitiesSlide = pptx.addSlide();
      moreActivitiesSlide.background = { color: colors.white };
      
      addHeader(moreActivitiesSlide, '🎯 Activities (Continued)', colors.secondary);
      
      activities.slice(activitiesPerSlide).forEach((act, index) => {
        const boxColors = [colors.primary, colors.secondary, colors.accent, colors.success, '#8B5CF6'];
        moreActivitiesSlide.addShape(pptx.ShapeType.rect, {
          x: 0.4,
          y: 1.2 + (index * 1.1),
          w: 9.2,
          h: 1,
          fill: { color: boxColors[(index + activitiesPerSlide) % boxColors.length] },
          transparency: 10
        });
        
        moreActivitiesSlide.addText(`${index + activitiesPerSlide + 1}`, {
          x: 0.6,
          y: 1.3 + (index * 1.1),
          w: 0.6,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: colors.white,
          align: 'center',
          valign: 'middle'
        });
        
        moreActivitiesSlide.addText(act, {
          x: 1.4,
          y: 1.25 + (index * 1.1),
          w: 8.2,
          h: 0.9,
          fontSize: 14,
          color: colors.dark,
          valign: 'middle'
        });
      });
    }
  }

  // Slide 6: Wrap-up
  if (plan.content.lessonFlow?.wrapUp) {
    const wrapUpSlide = pptx.addSlide();
    wrapUpSlide.background = { color: colors.white };
    
    addHeader(wrapUpSlide, '✅ Wrap-up', colors.success);
    
    // Add background content area
    wrapUpSlide.addShape(pptx.ShapeType.rect, {
      x: 0.4,
      y: 1.3,
      w: 9.2,
      h: 5.5,
      fill: { color: colors.light },
      line: { color: colors.success, width: 2 }
    });
    
    wrapUpSlide.addText(plan.content.lessonFlow.wrapUp, {
      x: 0.7,
      y: 1.5,
      w: 8.6,
      h: 5.1,
      fontSize: 16,
      color: colors.dark,
      align: 'left',
      valign: 'top'
    });
  }

  // Slide 7: Assessment
  if (plan.content.assessment) {
    const assessmentSlide = pptx.addSlide();
    assessmentSlide.background = { color: colors.white };
    
    addHeader(assessmentSlide, '📊 Assessment', colors.accent);
    
    // Add background content area
    assessmentSlide.addShape(pptx.ShapeType.rect, {
      x: 0.4,
      y: 1.3,
      w: 9.2,
      h: 5.5,
      fill: { color: colors.light },
      line: { color: colors.accent, width: 2 }
    });
    
    assessmentSlide.addText(plan.content.assessment, {
      x: 0.7,
      y: 1.5,
      w: 8.6,
      h: 5.1,
      fontSize: 16,
      color: colors.dark,
      align: 'left',
      valign: 'top'
    });
  }

  // Slide 8: Homework
  if (plan.content.homework) {
    const homeworkSlide = pptx.addSlide();
    homeworkSlide.background = { color: colors.white };
    
    addHeader(homeworkSlide, '📝 Homework', colors.primary);
    
    // Add background content area
    homeworkSlide.addShape(pptx.ShapeType.rect, {
      x: 0.4,
      y: 1.3,
      w: 9.2,
      h: 5.5,
      fill: { color: '#FEF3C7' },
      line: { color: colors.primary, width: 2 }
    });
    
    homeworkSlide.addText(plan.content.homework, {
      x: 0.7,
      y: 1.5,
      w: 8.6,
      h: 5.1,
      fontSize: 16,
      color: colors.dark,
      align: 'left',
      valign: 'top'
    });
  }

  // Slide 9: Summary
  if (plan.content.summary) {
    const summarySlide = pptx.addSlide();
    summarySlide.background = { color: colors.white };
    
    addHeader(summarySlide, '🎓 Summary', colors.secondary);
    
    // Add background content area
    summarySlide.addShape(pptx.ShapeType.rect, {
      x: 0.4,
      y: 1.3,
      w: 9.2,
      h: 5.5,
      fill: { color: colors.light },
      line: { color: colors.secondary, width: 2 }
    });
    
    summarySlide.addText(plan.content.summary, {
      x: 0.7,
      y: 1.5,
      w: 8.6,
      h: 5.1,
      fontSize: 16,
      color: colors.dark,
      align: 'left',
      valign: 'top'
    });
  }
  
  // Final Slide: Thank You
  const thankyouSlide = pptx.addSlide();
  thankyouSlide.background = { color: colors.primary };
  
  // Add secondary accent shape
  thankyouSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 3,
    w: 10,
    h: 4.5,
    fill: { color: colors.secondary },
    transparency: 20
  });
  
  thankyouSlide.addText('Thank You!', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 54,
    bold: true,
    color: colors.white,
    align: 'center'
  });
  
  thankyouSlide.addText('Questions?', {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 0.6,
    fontSize: 32,
    color: colors.white,
    align: 'center',
    italic: true
  });
  
  thankyouSlide.addText(`${plan.subject} • Grade ${plan.grade}`, {
    x: 0.5,
    y: 5.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: colors.white,
    align: 'center'
  });
  
  // Add decorative shapes
  thankyouSlide.addShape(pptx.ShapeType.ellipse, {
    x: 1,
    y: 1,
    w: 1.5,
    h: 1.5,
    fill: { color: colors.accent },
    transparency: 30,
    line: { color: colors.white, width: 2 }
  });
  
  thankyouSlide.addShape(pptx.ShapeType.ellipse, {
    x: 7.5,
    y: 5.5,
    w: 1.2,
    h: 1.2,
    fill: { color: colors.success },
    transparency: 30,
    line: { color: colors.white, width: 2 }
  });

  return pptx;
};

