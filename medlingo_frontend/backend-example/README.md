# MedLingo Translator Backend Integration

This directory contains example backend implementations for the MedLingo Translator app.

## 🗄️ Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  patient_id UUID,
  provider_language VARCHAR(10) NOT NULL,
  patient_language VARCHAR(10) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER, -- in seconds
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, cancelled
  conversation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  speaker VARCHAR(20) NOT NULL, -- provider, patient
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  original_language VARCHAR(10) NOT NULL,
  translated_language VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  audio_url TEXT,
  translated_audio_url TEXT,
  processing_time INTEGER -- in milliseconds
);
```

### Providers Table
```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  default_language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  preferred_language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 API Endpoints

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session with conversations
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Cancel session

### Conversations
- `POST /api/conversations` - Add conversation to session
- `GET /api/sessions/:id/conversations` - Get session conversations

### Analytics
- `GET /api/analytics/sessions/:providerId` - Get session analytics
- `GET /api/analytics/conversations/:sessionId` - Get conversation analytics

### Providers
- `GET /api/providers/:id` - Get provider info
- `PUT /api/providers/:id` - Update provider settings

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/medlingo
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medlingo
DB_USER=username
DB_PASSWORD=password

# API
API_PORT=3000
API_BASE_URL=http://localhost:3000/api
JWT_SECRET=your-jwt-secret
API_KEY=your-api-key

# External Services
TRANSLATION_API_KEY=your-translation-api-key
SPEECH_API_KEY=your-speech-api-key
```

## 📊 Analytics Queries

### Session Analytics
```sql
-- Total sessions for provider
SELECT COUNT(*) as total_sessions 
FROM sessions 
WHERE provider_id = $1;

-- Average session duration
SELECT AVG(duration) as avg_duration 
FROM sessions 
WHERE provider_id = $1 AND status = 'completed';

-- Most used language pairs
SELECT 
  provider_language, 
  patient_language, 
  COUNT(*) as count
FROM sessions 
WHERE provider_id = $1 
GROUP BY provider_language, patient_language 
ORDER BY count DESC;
```

## 🔐 Security Considerations

1. **Data Encryption**: All sensitive data encrypted at rest
2. **API Authentication**: JWT tokens for provider authentication
3. **Rate Limiting**: Prevent abuse of translation services
4. **Data Retention**: Automatic cleanup of old session data
5. **HIPAA Compliance**: Healthcare data protection standards

## 🚀 Deployment Options

### Option 1: Node.js + Express + PostgreSQL
- Fast development and deployment
- Good for MVP and testing
- Easy to scale horizontally

### Option 2: Python + FastAPI + PostgreSQL
- Excellent for AI/ML integration
- Great performance for data processing
- Strong typing and validation

### Option 3: Go + Gin + PostgreSQL
- High performance and concurrency
- Excellent for production workloads
- Small memory footprint

## 📈 Monitoring and Logging

1. **Session Metrics**: Track session success rates, duration, errors
2. **Translation Performance**: Monitor translation accuracy and speed
3. **User Analytics**: Understand usage patterns
4. **Error Tracking**: Comprehensive error logging and alerting
5. **Performance Monitoring**: Database query performance, API response times

