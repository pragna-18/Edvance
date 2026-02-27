import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.lessonPlan.findFirst();
  
  if (plan) {
    console.log('=== First Lesson Plan ===');
    console.log('Title:', plan.title);
    console.log('Content type:', typeof plan.content);
    console.log('Content keys:', Object.keys(plan.content || {}));
    console.log('\nFull content:', JSON.stringify(plan.content, null, 2));
  } else {
    console.log('No lesson plans found');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
