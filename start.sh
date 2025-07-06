#!/bin/bash

echo "🚀 Starting Digital Persona Platform..."

# Check virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found"
    exit 1
fi

source venv/bin/activate

echo "✅ Virtual environment activated"
echo "🐍 Python: $(python --version)"

# Show package versions
python -c "
import fastapi, pydantic
print(f'⚡ FastAPI: {fastapi.__version__}')
print(f'📦 Pydantic: {pydantic.VERSION}')
"

echo ""
echo "🌟 Starting FastAPI server..."
echo ""
echo "📍 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "💚 Health: http://localhost:8000/health"
echo "🧪 Test: http://localhost:8000/test"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
