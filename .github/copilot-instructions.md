# University Course Scheduling System - AI Agent Instructions

## Project Overview
This is a **NestJS + Prisma** university course scheduling system implementing complex time-based enrollment validation. The core architecture centers around a `Section` model that connects `Teacher`, `Subject`, `Classroom`, and `Student` entities with sophisticated schedule conflict detection.

Skip redundant comments in the code

## Critical Architecture Patterns

### Database-First Design with Prisma
- **Schema location**: `api/prisma/schema.prisma` - All models, enums, and relationships defined here
- **Migration workflow**: Always run `npx prisma db seed` after schema changes to populate test data
- **Key insight**: `Section` is the central join model with time constraints, not just a simple many-to-many table

### NestJS Module Structure
- **Module pattern**: Each domain gets `{domain}.module.ts`, `{domain}.service.ts`, `{domain}.controller.ts`
- **DTOs**: Located in `src/{domain}/dto/` using `class-validator` decorators
- **Prisma integration**: All services inject `PrismaService`, never instantiate `PrismaClient` directly

### Schedule Conflict Detection Logic
- **Core algorithm**: Time overlap detection using `(start1 < end2) && (start2 < end1)`
- **Day mapping**: `SectionScheduleType` enum maps to `DayOfWeek[]` arrays via `getSectionDays()`
- **Implementation**: See `StudentService.checkScheduleConflict()` for the full algorithm

## Development Workflow

### Environment Setup (Required Steps)
```bash
# 1. Start database
docker-compose up -d

# 2. Navigate to API directory
cd api

# 3. Database setup (critical order)
npm run prisma:generate:client  # Generate types
npm run prisma:migrate:deploy   # Apply migrations  
npx prisma db seed             # Populate test data

# 4. Start development
npm run start:dev
```

### Project-Specific Commands
- **Database reset**: `npx prisma migrate reset --force` (dev only)
- **New migration**: `npx prisma migrate dev --name descriptive_name`

## Code Conventions

### Error Handling Pattern
```typescript
// Standard pattern across all services
if (!entity) {
  throw new NotFoundException('Entity not found')
}
if (conflictCondition) {
  throw new ConflictException('Descriptive message with context')
}
```

### Service Method Structure
1. **Validation**: Check entity existence
2. **Business logic**: Conflict detection, capacity checks
3. **Database operations**: Transactional updates
4. **Return**: Enriched objects with relations

### Prisma Query Patterns
- **Always include relations** for API responses: `include: { teacher: true, subject: true }`
- **Use select for sensitive data**: Teacher queries exclude personal info in public endpoints
- **Compound unique constraints**: `@@unique([studentId, sectionId])` prevents duplicate enrollments

## Domain-Specific Knowledge

### Schedule Types & Time Handling
- **MWF/TR patterns**: Hard-coded in `getSectionDays()` method
- **Time storage**: Prisma stores as `@db.Time`, always use `new Date('1970-01-01T{time}Z')` format
- **Conflict detection**: Operates on both day overlap AND time range overlap

### Enrollment Business Rules
- **Capacity limits**: `currentEnrollment < maxEnrollment` checked before enrollment
- **Semester isolation**: Students can only conflict within same semester/year
- **Automatic counters**: Enrollment counts updated via increment/decrement operations

## Testing & API Validation
- **Manual testing**: Use `test-api.sh` to validate enrollment conflicts
- **Seed data**: Contains realistic conflicts for testing (Alice enrolled in overlapping sections)
- **API base**: All endpoints prefixed with `/api` via global prefix in `main.ts`

## Configuration & Environment
- **Config pattern**: Zod schemas in `config.ts`, environment-specific `.env` files
- **Database URL**: Uses Docker container IP, check `.env` for current connection
- **Port**: Default 5000, configurable via `PORT` environment variable

When modifying this system, always consider the enrollment conflict detection logic and test with overlapping time scenarios.
