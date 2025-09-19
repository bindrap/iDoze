#!/bin/bash

echo "Setting up iDoze Docker environment..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.docker .env
    echo "Created .env file from .env.docker"
    echo "Please update .env with your actual values before running the application"
fi

# Build and start the services
echo "Starting PostgreSQL database..."
docker compose up -d postgres

echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker compose exec postgres pg_isready -U idoze_user -d idoze; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "PostgreSQL is ready!"

# Build the application
echo "Building the application..."
docker compose build app

# Run database migrations
echo "Running database migrations..."
docker compose run --rm app npx prisma db push

echo "Seeding database with initial data..."
docker compose run --rm app npm run db:generate

echo "Setup complete! Starting the application..."
docker compose up -d app

echo ""
echo "Application is now running!"
echo "- Web app: http://localhost:3000"
echo "- PostgreSQL: localhost:5432"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo "To stop and remove volumes: docker compose down -v"