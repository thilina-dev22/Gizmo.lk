import type { IncomingMessage, ServerResponse } from 'http';

export type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
  body?: any;
};

export type VercelResponse = ServerResponse & {
  send?: (body: any) => VercelResponse;
  json?: (jsonBody: any) => VercelResponse;
  status?: (statusCode: number) => VercelResponse;
};

export function sendJson(res: any, statusCode: number, data: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-session');
    
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(data);
    }
  } catch (e) {}

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(data));
}

export function sendText(res: any, statusCode: number, text: string, contentType = 'text/plain') {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (typeof res.status === 'function' && typeof res.send === 'function') {
      res.setHeader('Content-Type', contentType);
      return res.status(statusCode).send(text);
    }
  } catch (e) {}

  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  return res.end(text);
}
