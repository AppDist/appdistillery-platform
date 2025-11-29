# API Documentation Template

Use this template when documenting REST API endpoints. Customize sections based on your project's needs.

---

## Template Structure

```markdown
## [METHOD] /api/[path]

**Purpose**: [One clear sentence]

**Authentication**: Required | Optional | None

**Rate Limiting**: [If applicable]

### Request

**Path Parameters**:
- `id` (string, required) - [Description]

**Query Parameters**:
- `filter` (string, optional) - [Description]
- `page` (number, optional) - Page number (default: 1)

**Request Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json` (required)

**Request Body**:
```json
{
  "field1": "string",      // [Description] (required)
  "field2": 123,           // [Description] (optional, default: 100)
  "nested": {
    "value": "string"      // [Description] (required)
  }
}
```

**Validation Rules**:
- `field1`: Must be non-empty, max 255 characters
- `field2`: Must be positive integer

### Response

**Success (200 OK)**:
```json
{
  "id": "uuid",
  "status": "success",
  "data": {
    "result": "value"
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid input
```json
{
  "error": "INVALID_INPUT",
  "message": "Field 'field1' is required",
  "details": {
    "field": "field1",
    "expected": "non-empty string"
  }
}
```

**401 Unauthorized** - Missing or invalid authentication
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

**404 Not Found** - Resource does not exist
```json
{
  "error": "NOT_FOUND",
  "message": "Resource with id 'xyz' not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req-12345"
}
```

### Examples

**cURL**:
```bash
curl -X POST https://api.example.com/api/resource \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field1": "value",
    "field2": 150
  }'
```

**TypeScript**:
```typescript
import { apiClient } from '@/lib/api';

const result = await apiClient.post('/api/resource', {
  field1: 'value',
  field2: 150
});

console.log(result.data.id); // uuid
```

**Python**:
```python
import requests

response = requests.post(
    'https://api.example.com/api/resource',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'field1': 'value',
        'field2': 150
    }
)

data = response.json()
print(data['id'])
```

### Related Endpoints

- `GET /api/resource/:id` - Retrieve resource details
- `PATCH /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

### Notes

- [Performance considerations]
- [Caching behavior]
- [Deprecation notices]
- [Version compatibility]

---

## Example: Real API Documentation

### POST /api/proposals/generate

**Purpose**: Generate multiple proposal variants using AI for a given client and requirements.

**Authentication**: Required (Bearer token)

**Rate Limiting**: 10 requests per minute per organization

### Request

**Request Body**:
```json
{
  "clientId": "uuid",              // Client ID (required)
  "requirements": "string",        // Project requirements (required, 50-5000 chars)
  "variantCount": 3,               // Number of variants (optional, 3-5, default: 3)
  "tone": "professional"           // Tone style (optional, default: "professional")
}
```

**Validation Rules**:
- `requirements`: 50-5000 characters
- `variantCount`: Integer between 3-5
- `tone`: One of: "professional", "casual", "technical"

### Response

**Success (200 OK)**:
```json
{
  "id": "proposal-uuid",
  "status": "completed",
  "proposals": [
    {
      "variantId": "var-1",
      "title": "E-commerce Platform",
      "summary": "...",
      "estimatedCost": 45000,
      "timeline": "12 weeks"
    }
  ],
  "metadata": {
    "qUnitsUsed": 180,
    "processingTime": 3.2,
    "model": "claude-sonnet-4"
  }
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "INVALID_INPUT",
  "message": "Requirements must be between 50 and 5000 characters",
  "details": {
    "field": "requirements",
    "current": 30,
    "expected": "50-5000"
  }
}
```

**402 Payment Required**:
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Insufficient Q-Units balance",
  "details": {
    "required": 180,
    "available": 50,
    "topUpUrl": "/billing/top-up"
  }
}
```

### Examples

**TypeScript (Next.js)**:
```typescript
'use server';

import { generateProposal } from '@/modules/proposal/actions';

export async function createProposal(clientId: string, requirements: string) {
  try {
    const result = await generateProposal({
      clientId,
      requirements,
      variantCount: 3,
      tone: 'professional'
    });
    
    return {
      success: true,
      proposalId: result.id,
      variants: result.proposals
    };
  } catch (error) {
    if (error.code === 'QUOTA_EXCEEDED') {
      return { 
        success: false, 
        error: 'Insufficient credits. Please top up.' 
      };
    }
    throw error;
  }
}
```

### Related Endpoints

- `GET /api/proposals/:id` - Retrieve proposal details
- `PATCH /api/proposals/:id/variants/:variantId` - Modify a specific variant
- `POST /api/proposals/:id/send` - Send proposal to client

### Notes

- Generation typically takes 3-5 seconds
- Q-Units are charged immediately on successful generation
- Failed generations do not consume Q-Units
- Variants are cached for 24 hours for re-generation
- Use webhooks for async notification when generation completes
```

---

## Customization Tips

### For Your Project

1. **Add project-specific sections**:
   - Cost/billing information (if applicable)
   - Performance metrics (SLA, typical response times)
   - Webhook events (if applicable)
   - Versioning information

2. **Adapt error codes**:
   - Use your project's error code conventions
   - Document all possible error codes
   - Include troubleshooting steps

3. **Include authentication details**:
   - JWT structure
   - Token refresh flow
   - Scope/permission requirements

4. **Add integration examples**:
   - SDK usage if available
   - GraphQL equivalent (if applicable)
   - WebSocket alternative (if applicable)

### Keep It DRY

- Store common error responses in a separate file
- Reference shared authentication docs
- Link to rate limiting policy doc
- Cross-reference related endpoints

### Context Efficiency

- Don't document every possible parameter combination
- Show the most common use cases
- Link to full OpenAPI/Swagger spec if available
- Keep examples realistic and tested
