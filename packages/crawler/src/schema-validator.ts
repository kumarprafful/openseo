import type { SchemaValidationResult } from './types.js';

const SCHEMA_REQUIRED_PROPS: Record<string, string[]> = {
  Article: ['headline', 'author'],
  NewsArticle: ['headline', 'author', 'datePublished'],
  BlogPosting: ['headline', 'author', 'datePublished'],
  Organization: ['name'],
  WebSite: ['name', 'url'],
  Person: ['name'],
  Product: ['name'],
  LocalBusiness: ['name', 'address'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  Recipe: ['name', 'recipeIngredient'],
  Event: ['name', 'startDate'],
  Review: ['itemReviewed', 'reviewRating'],
};

export function validateSchema(jsonLd: Record<string, unknown>[]): SchemaValidationResult {
  const errors: { path: string; message: string }[] = [];
  const types: string[] = [];

  for (let i = 0; i < jsonLd.length; i++) {
    const block = jsonLd[i];
    const type = block['@type'];

    if (!type) {
      errors.push({ path: `[${i}]`, message: 'Missing @type' });
      continue;
    }

    const typeName = Array.isArray(type) ? (type[0] as string) : (type as string);
    types.push(typeName);

    if (!block['@context']) {
      errors.push({ path: `[${i}].${typeName}`, message: 'Missing @context' });
    }

    if (block['@context'] && block['@context'] !== 'https://schema.org') {
      errors.push({ path: `[${i}].${typeName}`, message: `Unexpected @context: ${block['@context']}` });
    }

    const required = SCHEMA_REQUIRED_PROPS[typeName];
    if (required) {
      for (const prop of required) {
        if (block[prop] === undefined || block[prop] === null) {
          errors.push({ path: `[${i}].${typeName}`, message: `Missing required property: ${prop}` });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, types };
}

export function extractJsonLd(raw: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const scriptRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(raw)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {
      // skip invalid JSON-LD
    }
  }

  return results;
}
