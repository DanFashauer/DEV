/**
 * API Documentation (Swagger UI)
 * GET /api/docs
 * 
 * Interactive API documentation for all public endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>SignalGrid API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
    <style>
      html {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *, *:before, *:after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        padding: 0;
        background: #f5f5f5;
      }
      .topbar {
        background-color: #1a1a1a;
        padding: 10px 0;
        margin: 0;
        border-bottom: 1px solid #ddd;
      }
      .topbar > div {
        max-width: 1460px;
        margin: 0 auto;
        padding: 0 15px;
      }
      .topbar h1 {
        color: #fff;
        margin: 5px 0;
        font-size: 1.5em;
      }
      .info {
        color: #aaa;
        font-size: 0.9em;
      }
    </style>
  </head>
  <body>
    <div class="topbar">
      <div>
        <h1>SignalGrid API Documentation</h1>
        <div class="info">
          Enterprise Device Security & Compliance Platform
          <br/>
          <a href="https://github.com" style="color: #0066ff;">GitHub</a> | 
          <a href="/openapi.json" style="color: #0066ff;">OpenAPI Spec</a>
        </div>
      </div>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.js"></script>
    <script>
      SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        tryItOutEnabled: true,
        showOperationFilterTag: true,
        filter: true,
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        }
      })
    </script>
  </body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function HEAD(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
