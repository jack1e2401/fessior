export type Operation = {
  tags: string[];
  summary: string;
  description?: string;
  security?: { bearerAuth: never[] }[];
  parameters?: Record<string, unknown>[];
  requestBody?: Record<string, unknown>;
  responses: Record<string, unknown>;
};
export type Paths = Record<string, Record<string, Operation>>;
export const bearer = [{ bearerAuth: [] as never[] }];
export const path = (name: string) => ({ name, in: 'path', required: true, schema: { type: 'string' } });
export const query = (name: string, type = 'string') => ({ name, in: 'query', schema: { type } });
export const page = [query('page', 'integer'), query('limit', 'integer')];
export const body = (schema: Record<string, unknown>) => ({
  required: true,
  content: { 'application/json': { schema } },
});
export const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
});
export const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
export const response = (description: string, schema?: Record<string, unknown>) => ({
  description,
  ...(schema ? { content: { 'application/json': { schema } } } : {}),
});
export const success = (description: string) => response(description, ref('SuccessResponse'));
export const errors = {
  400: response('Invalid request', ref('ErrorResponse')),
  401: response('Authentication required', ref('ErrorResponse')),
  403: response('Administrator permission required', ref('ErrorResponse')),
  404: response('Resource not found', ref('ErrorResponse')),
};
export const op = (tag: string, summary: string, status = 200, options: Partial<Operation> = {}): Operation => ({
  tags: [tag],
  summary,
  security: bearer,
  responses: { [status]: success(summary), ...errors },
  ...options,
});
