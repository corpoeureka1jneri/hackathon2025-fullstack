import { NextRequest, NextResponse } from 'next/server';

const ODOO_API_BASE = process.env.NEXT_PUBLIC_ODOO_API_URL || 'http://localhost:8069/api/support';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

type JsonRecord = Record<string, unknown>;

const normalizePayload = (body: JsonRecord | undefined): JsonRecord => {
  if (!body) {
    return {};
  }
  if (body.params && typeof body.params === 'object') {
    return body.params as JsonRecord;
  }
  return body;
};

const parseBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return defaultValue;
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json().catch(() => ({}))) as JsonRecord | undefined;
    const payload = normalizePayload(rawBody);

    const rawLimit = payload.limit;

    let limit: number;
    if (rawLimit === undefined || rawLimit === null) {
      limit = DEFAULT_LIMIT;
    } else if (typeof rawLimit === 'number') {
      limit = rawLimit;
    } else if (typeof rawLimit === 'string') {
      const trimmed = rawLimit.trim();
      if (!/^\d+$/.test(trimmed)) {
        return NextResponse.json(
          { success: false, error: 'El parámetro limit debe ser numérico' },
          { status: 400 }
        );
      }
      limit = Number(trimmed);
    } else {
      return NextResponse.json(
        { success: false, error: 'El parámetro limit debe ser numérico' },
        { status: 400 }
      );
    }

    if (Number.isNaN(limit)) {
      return NextResponse.json(
        { success: false, error: 'El parámetro limit debe ser numérico' },
        { status: 400 }
      );
    }

    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }
    if (limit < 1) {
      limit = DEFAULT_LIMIT;
    }

    const onlyActive = parseBoolean(payload.only_active, true);

    const normalizedPayload: JsonRecord = {
      ...payload,
      limit,
      only_active: onlyActive,
    };

    const odooRequestBody = rawBody && rawBody.params
      ? { ...rawBody, params: normalizedPayload }
      : normalizedPayload;

    const response = await fetch(`${ODOO_API_BASE}/assignees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(odooRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response assignees:', errorText);
      throw new Error(`Error al obtener los asignatarios de Odoo: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result = (data as JsonRecord).result || data;
    const records = (result as JsonRecord).records || [];
    const count = (result as JsonRecord).count ?? (Array.isArray(records) ? records.length : 0);

    return NextResponse.json({
      success: true,
      assignees: Array.isArray(records) ? records : [],
      count,
    });
  } catch (error) {
    console.error('Error fetching assignees:', error);
    const message = error instanceof Error ? error.message : 'Error al obtener los asignatarios';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
