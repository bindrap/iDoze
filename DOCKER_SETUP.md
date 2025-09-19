# Docker Setup Guide

Your iDoze gym management system is now running with Docker and PostgreSQL!

## What was changed:

1. **Database**: Migrated from SQLite to PostgreSQL for better performance and reliability
2. **Docker Compose**: Set up with separate PostgreSQL and application containers
3. **Environment**: Configured with proper environment variables
4. **Build**: Fixed Prisma compatibility issues with Alpine Linux

## Current Status:

✅ **PostgreSQL Database**: Running on port 5432
✅ **Web Application**: Running on http://localhost:3000
✅ **Database Schema**: Successfully migrated to PostgreSQL
✅ **Container Health**: All services healthy

## Quick Commands:

### Start the application:
```bash
docker compose up -d
```

### Stop the application:
```bash
docker compose down
```

### View logs:
```bash
docker compose logs -f app          # Application logs
docker compose logs -f postgres     # Database logs
docker compose logs -f              # All logs
```

### Access the application:
- **Web Interface**: http://localhost:3000
- **Database**: localhost:5432 (username: idoze_user, password: secure_password_123)

### Database operations:
```bash
# Run migrations
docker compose run --rm app npx prisma db push

# Access database shell
docker compose exec postgres psql -U idoze_user -d idoze

# Backup database
docker compose exec postgres pg_dump -U idoze_user idoze > backup.sql
```

## Environment Configuration:

The application uses the `.env` file for configuration. Key variables:
- `POSTGRES_PASSWORD`: Database password
- `NEXTAUTH_SECRET`: Authentication secret
- `SMTP_*`: Email configuration (optional)

## Background Image Issue:

The background image selector issue mentioned in CLAUDE.md should now be resolved with the proper database setup, as the application can now properly persist and retrieve image settings.

## Troubleshooting:

If you encounter issues:
1. Check container status: `docker compose ps`
2. Check logs: `docker compose logs app`
3. Restart services: `docker compose restart`
4. Rebuild if needed: `docker compose build app`

## Production Notes:

For production deployment:
1. Change the default passwords in `.env`
2. Set proper NEXTAUTH_SECRET
3. Configure SMTP settings for email notifications
4. Consider using managed PostgreSQL service
5. Set up proper backup strategy