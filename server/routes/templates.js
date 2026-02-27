import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { isPublic, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [
        { isPublic: true },
        { ownerId: req.user.id }
      ]
    };

    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.template.count({ where })
    ]);

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if user has access
    if (!template.isPublic && template.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create template
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('structure').notEmpty().withMessage('Structure is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, structure, isPublic = false } = req.body;

    const template = await prisma.template.create({
      data: {
        name,
        description,
        structure,
        isPublic,
        ownerId: req.user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'template_created',
        description: `Created template: ${name}`
      }
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update template
router.put('/:id', [
  body('name').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, structure, isPublic } = req.body;

    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (existingTemplate.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        description,
        structure,
        isPublic
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'template_updated',
        description: `Updated template: ${template.name}`
      }
    });

    res.json({ template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.template.delete({
      where: { id }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'template_deleted',
        description: `Deleted template: ${template.name}`
      }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;






