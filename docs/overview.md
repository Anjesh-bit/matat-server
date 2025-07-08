# WooCommerce Sync Application

A robust Node.js application for synchronizing WooCommerce store data with a local database, featuring automated sync capabilities, API endpoints, and comprehensive logging.

## Features

### Core Functionality

- **Multi-endpoint API**: Separate endpoints for orders, products, and manual sync operations
- **WooCommerce Integration**: Seamless data fetching from WooCommerce stores using Axios
- **Database Synchronization**: Automated and manual sync capabilities with local database
- **Data Retention**: Configurable retention policies (30 days for orders, 3 months for products)

### Sync Capabilities

- **On-Demand Sync**: Manual trigger functionality for immediate synchronization
- **Automated Sync**: Cron job-based automatic synchronization
- **Smart Product Sync**: `syncAllMissingProducts` function that:
  - Syncs only the newest products
  - Skips existing products with matching IDs
  - Automatically deletes products older than 3 months using `deleteMany`
- **Incremental Updates**: Efficient syncing that avoids duplicate processing

## Technical Stack

### Core Dependencies

- **Express.js**: Web framework for API endpoints
- **Axios**: HTTP client for WooCommerce API communication
- **Winston Logger**: Comprehensive logging solution with detailed phase tracking
- **Morgan**: HTTP request logging middleware (alternative logging option)
- **Joi**: Schema validation for request/response data
- **Node-cron**: Scheduled task management for automated sync

### Security & Performance

- **Helmet**: Security middleware for HTTP headers
- **CORS**: Cross-origin resource sharing configuration
- **Express Rate Limiter**: API request rate limiting
- **P-Limit**: Concurrency control for async operations

### Development Tools

- **ESLint**: Code linting and style enforcement
- **Jest** (implied): Unit testing framework
- **VSCode Configuration**: Optimized development environment setup

## API Endpoints

### Health Check

- `GET /health` - Application health status monitoring

### Orders

- Order management endpoints with 30-day retention policy
- Automated sync via cron jobs

### Products

- Product synchronization endpoints
- Smart sync with duplicate detection
- Automated cleanup of products older than 3 months

### Manual Sync

- On-demand synchronization triggers
- Manual data refresh capabilities

## Logging & Monitoring

### Winston Logger

- Comprehensive logging throughout all application phases
- Detailed sync operation tracking
- Error and success state logging
- Configurable log levels and formats

### Morgan Integration

- HTTP request/response logging
- Alternative logging solution for request tracking

## Data Management

### Retention Policies

- **Orders**: 30-day retention with automatic cleanup
- **Products**: 3-month retention with batch deletion using `deleteMany`

### Sync Strategies

- **Manual Sync**: User-triggered synchronization
- **Automated Sync**: Cron job-based scheduling
- **Smart Sync**: Intelligent duplicate detection and newest-first processing

## Testing

### Unit Tests

- **Order Services**: Comprehensive test coverage for order operations
- **Product Services**: Product sync and management testing
- Demonstrates testing capabilities and best practices

## Configuration

### Environment Setup

- WooCommerce API credentials configuration
- Database connection settings
- Sync schedule configuration
- Rate limiting parameters

### Development Environment

- ESLint configuration for code quality
- VSCode settings for optimal development experience
- Joi validation schemas for data integrity

## Security Features

- **Helmet**: Secure HTTP headers
- **CORS**: Controlled cross-origin access
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Joi schema validation
- **Error Handling**: Centralized error handling middleware

## Performance Optimizations

- **Concurrency Control**: P-Limit for managing async operations
- **Efficient Querying**: Smart product sync with ID-based duplicate detection
- **Batch Operations**: Bulk deletion for data cleanup
- **Caching Strategy**: Optimized data retrieval patterns

## Monitoring & Maintenance

- Health check endpoint for application monitoring
- Comprehensive logging for troubleshooting
- Automated cleanup processes for data management
- Rate limiting for API protection

## Future Enhancements

- Extended retention policy configurations
- Advanced sync filtering options
- Real-time sync capabilities
- Enhanced monitoring dashboard
- Performance metrics collection

---

_This application provides a reliable, scalable solution for WooCommerce data synchronization with robust error handling, comprehensive logging, and flexible sync options._
