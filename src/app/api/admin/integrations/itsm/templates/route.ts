// ============================================================================
// ITSM Ticket Template CRUD API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { 
  getTicketTemplates, 
  getTicketTemplate, 
  createTicketTemplate, 
  updateTicketTemplate, 
  deleteTicketTemplate,
  seedTicketTemplates,
  type TicketTemplate 
} from '@/lib/integrations/itsm/store';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: z.string().min(1).max(50),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'informational']),
  titleTemplate: z.string().min(1).max(200),
  descriptionTemplate: z.string().min(1).max(5000),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

// ============================================================================
// GET Handler - List all templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Special action: seed default templates
    if (action === 'seed') {
      await seedTicketTemplates();
      return NextResponse.json({ message: 'Templates seeded successfully' });
    }
    
    const templates = await getTicketTemplates();
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('ITSM templates GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler - Create new template
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const template = CreateTemplateSchema.parse(body);
    
    const created = await createTicketTemplate(template);
    
    return NextResponse.json({ template: created }, { status: 201 });
  } catch (error) {
    console.error('ITSM templates POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH Handler - Update template
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing template ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const updates = UpdateTemplateSchema.parse(body);
    
    const updated = await updateTicketTemplate(id, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error('ITSM templates PATCH error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE Handler - Delete template
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing template ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteTicketTemplate(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ITSM templates DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
