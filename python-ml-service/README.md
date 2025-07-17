# 🤖 Digital Persona Platform - ML Service

A dedicated Python microservice providing AI and ML capabilities for the Digital Persona Platform.

## 🌟 Features

- **🧠 OpenAI Integration**: Chat completions, image analysis, text processing, embeddings
- **👁️ Computer Vision**: Object detection, face analysis, scene understanding (OpenAI Vision + OpenCV)
- **🔊 Voice Synthesis**: Text-to-speech with multiple engines (placeholder)
- **💾 Memory System**: Vector embeddings and semantic search (placeholder)
- **📚 Personality Learning**: Adaptive persona traits from interactions (placeholder)

## 🏗️ Architecture

### Service Structure

```
python-ml-service/
├── app/
│   ├── config/          # Configuration and settings
│   ├── services/        # Core ML services
│   ├── routers/         # FastAPI route handlers
│   ├── models/          # Data models
│   └── utils/           # Utility functions
├── tests/               # Test suite
├── Dockerfile           # Container configuration
├── docker-compose.yml   # Local development setup
└── requirements.txt     # Python dependencies
```

### API Endpoints

#### Health & Monitoring

- `GET /` - Service information
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /health/models` - ML model status
- `GET /health/readiness` - Kubernetes readiness probe
- `GET /health/liveness` - Kubernetes liveness probe

#### OpenAI Services

- `POST /openai/chat/completions` - Generate chat completions
- `POST /openai/vision/analyze` - Analyze images with Vision API
- `POST /openai/text/personality-analysis` - Analyze text for personality traits
- `POST /openai/embeddings` - Generate text embeddings
- `GET /openai/status` - OpenAI service status
- `GET /openai/models` - Available models

#### Computer Vision

- `POST /cv/analyze` - Multi-modal image analysis
- `GET /cv/status` - Computer vision service status
- `GET /cv/capabilities` - Available analysis capabilities

#### Voice Synthesis (Placeholder)

- `GET /voice/status` - Voice synthesis status
- `GET /voice/engines` - Available TTS engines

#### Memory System (Placeholder)

- `GET /memory/status` - Memory system status

#### Personality Learning (Placeholder)

- `GET /learning/status` - Personality learning status

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- OpenAI API Key (optional but recommended)

### Environment Setup

1. **Copy environment file:**

```bash
cp env.example .env
```

2. **Configure environment variables:**

```bash
# Required
OPENAI_API_KEY=your-openai-api-key-here

# Optional
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket
```

### Running with Docker

```bash
# Build and start the service
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f ml-service

# Stop the service
docker-compose down
```

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start the service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Service URLs

- **API Documentation**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/health
- **Service Info**: http://localhost:8001

## 🧪 Testing

### Using the API Documentation

1. Navigate to http://localhost:8001/docs
2. Try the health check endpoints
3. Test OpenAI services (requires API key)
4. Upload images for computer vision analysis

### Example API Calls

**Health Check:**

```bash
curl http://localhost:8001/health
```

**Chat Completion:**

```bash
curl -X POST "http://localhost:8001/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

**Image Analysis:**

```bash
curl -X POST "http://localhost:8001/cv/analyze" \
  -F "file=@image.jpg" \
  -F "analysis_types=objects,faces,text"
```

## 🔧 Configuration

### Environment Variables

| Variable                 | Description                          | Default     |
| ------------------------ | ------------------------------------ | ----------- |
| `OPENAI_API_KEY`         | OpenAI API key                       | None        |
| `ENVIRONMENT`            | Environment (development/production) | development |
| `LOG_LEVEL`              | Logging level                        | INFO        |
| `PORT`                   | Service port                         | 8001        |
| `ENABLE_COMPUTER_VISION` | Enable CV capabilities               | true        |
| `MAX_IMAGE_SIZE`         | Maximum image size (bytes)           | 10MB        |

### ML Model Configuration

- **OpenAI Models**: GPT-4 Turbo, GPT-4 Vision Preview
- **Computer Vision**: OpenAI Vision API + OpenCV fallback
- **Embeddings**: text-embedding-ada-002

## 🔗 Integration with Next.js Service

This ML service is designed to work with the Next.js application:

1. **Service Discovery**: Configured via `NEXTJS_SERVICE_URL`
2. **Authentication**: Service-to-service communication
3. **API Calls**: Next.js calls ML service endpoints for AI capabilities

Example integration in Next.js:

```typescript
// Call ML service from Next.js API route
const response = await fetch('http://ml-service:8001/openai/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [...] })
});
```

## 🏥 Health Monitoring

### Health Check Endpoints

- `/health` - Basic service health
- `/health/detailed` - Dependencies and capabilities
- `/health/models` - ML model status
- `/health/readiness` - Kubernetes readiness
- `/health/liveness` - Kubernetes liveness

### Docker Health Check

The Docker container includes automatic health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 🛡️ Security

- **API Validation**: Request/response validation with Pydantic
- **File Upload Security**: Type and size validation
- **Error Handling**: Comprehensive error responses
- **Logging**: Structured logging for monitoring

## 📊 Monitoring & Observability

- **Structured Logging**: JSON-formatted logs
- **Processing Time**: Response time headers
- **Health Metrics**: Service and dependency status
- **Error Tracking**: Detailed error logging

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set production values
2. **Resource Limits**: Configure memory/CPU limits
3. **Scaling**: Horizontal scaling with load balancer
4. **Monitoring**: Integrate with monitoring stack
5. **Secrets**: Use secure secret management

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-service
  template:
    metadata:
      labels:
        app: ml-service
    spec:
      containers:
        - name: ml-service
          image: digital-persona-ml-service:latest
          ports:
            - containerPort: 8001
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ml-service-secrets
                  key: openai-api-key
          livenessProbe:
            httpGet:
              path: /health/liveness
              port: 8001
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: 8001
```

## 🔄 Development Status

### ✅ Completed

- Core service architecture
- OpenAI integration (chat, vision, embeddings)
- Computer vision with OpenAI Vision API
- Health monitoring and status endpoints
- Docker containerization
- API documentation

### 🚧 In Progress / Planned

- Voice synthesis implementation
- Memory system with vector embeddings
- Personality learning algorithms
- Enhanced computer vision with OpenCV
- Performance optimization
- Comprehensive test suite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Digital Persona Platform.

---

**🎯 Ready for AI-powered digital persona interactions!**
