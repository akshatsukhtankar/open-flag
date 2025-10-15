#!/bin/bash

# OpenFlag Quick Start Script

set -e

echo "🚀 OpenFlag Quick Start"
echo "======================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and set strong passwords before deploying to production!"
    echo ""
fi

# Start services
echo "🐳 Starting OpenFlag services..."
echo ""

docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo ""
echo "🏥 Checking service health..."

if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

if curl -f http://localhost/ &> /dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 OpenFlag is running!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
echo "📚 For more information, see DEPLOYMENT.md"
