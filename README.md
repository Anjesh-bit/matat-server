# WooCommerce MERN Stack Backend

A robust backend API for syncing WooCommerce products and orders with automated scheduling and comprehensive data management.

## Features

- **WooCommerce Integration**: Seamless sync with WooCommerce REST API
- **Automated Scheduling**: Daily cron jobs for data synchronization
- **Data Management**: Intelligent product and order management with cleanup
- **RESTful API**: Well-structured endpoints for frontend integration
- **Error Handling**: Comprehensive error handling and logging
- **Testing**: Unit tests with Jest and Supertest
- **Security**: Rate limiting, CORS, and security headers
- **Performance**: Optimized database queries and caching strategies

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (Native driver, no Mongoose)
- **Jest** - Testing framework
- **Winston** - Logging
- **Joi** - Validation
- **Cron** - Scheduled tasks

## Project Structure

```
src/
├── config/
│   ├── database.ts              # MongoDB connection setup
│   └── woocommerce.ts           # WooCommerce API client setup
│
├── constant/
│   ├── cors.constant.ts         # CORS-related constants
│   └── logger.constant.ts       # Logger and message constants
│
├── controller/
│   ├── order.controller.ts      # Order controller
│   ├── products.controller.ts   # Product controller
│   └── sync.controller.ts       # WooCommerce sync controller
│
├── middleware/
│   ├── error-handler.middleware.ts     # Global error handler
│   ├── rate-limit.middleware.ts        # Rate limiting middleware
│   └── validate-query.middleware.ts    # Query validation middleware
│
├── routes/
│   └── v1/
│       ├── index.ts             # Base router for all v1 endpoints
│       ├── order.routes.ts      # Routes for order endpoints
│       ├── products.routes.ts   # Routes for product endpoints
│       └── sync.routes.ts       # Routes for sync operations
│
├── services/
│   ├── order.services.ts        # Order business logic
│   ├── product.services.ts      # Product business logic
│   └── sync.services.ts         # Sync orchestration logic
│
├── types/
│   ├── logger.types.ts          # Logger-related types
│   ├── order.types.ts           # Order interfaces/types
│   ├── product.types.ts         # Product interfaces/types
│   ├── query-params.types.ts    # Query params validation types
│   └── sync.types.ts            # Types related to syncing logic
│
├── utils/
│   └── logger.utils.ts          # Custom logger utility
│
├── validations/
│   └── schema.ts                # Zod validation schemas
│
├── app.ts                       # Express app configuration
└── server.ts                    # Server startup script

```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd woocommerce-sync-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**

   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Or use MongoDB Atlas (recommended for production)
   ```

5. **Run the application**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

| Variable                      | Description               | Default                                    |
| ----------------------------- | ------------------------- | ------------------------------------------ |
| `NODE_ENV`                    | Environment               | development                                |
| `PORT`                        | Server port               | 5000                                       |
| `DB_NAME`                     | Database name             | nodejstuts                                 |
| `WOOCOMMERCE_API_BASE_URL`    | WooCommerce store URL     | https://interview-test.matat.io            |
| `WOOCOMMERCE_CONSUMER_KEY`    | WooCommerce API key       | Required                                   |
| `WOOCOMMERCE_CONSUMER_SECRET` | WooCommerce API secret    | Required                                   |
| `SYNC_CRON_SCHEDULE`          | Cron schedule for sync    | 0 12 \* \* \*                              |
| `ORDER_RETENTION_DAYS`        | Order retention period    | 90                                         |
| `ORDER_FETCH_DAYS`            | Order fetch period        | 30                                         |

## API Endpoints

### Orders

- `GET /api/v1/orders` - Get paginated orders
  - Query params: `page`, `limit`, `search`, `status`, `sort`, `order`
- `GET /api/v1/orders/:id` - Get specific order
- `GET /api/v1/orders/product/:productId` - Get orders for specific product

### Products

- `GET /api/v1/products` - Get paginated products
  - Query params: `page`, `limit`, `search`, `sort`, `order`
- `GET /api/v1/products/:id` - Get specific product

### Sync

- `GET /api/v1/sync/status` - Get sync status
- `POST /api/v1/sync/trigger` - Trigger manual sync

### Health Check

- `GET /api/v1/health` - Health check endpoint

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Database Schema

### Orders Collection

```javascript
{
  id: Number,           // WooCommerce order ID
  number: String,       // Order number
  order_key: String,    // Order key
  status: String,       // Order status
  date_created: Date,   // Order creation date
  total: Number,        // Order total
  customer_id: Number,  // Customer ID
  customer_note: String, // Customer note
  billing: Object,      // Billing information
  shipping: Object,     // Shipping information
  line_items: Array,    // Order line items
  updatedAt: Date,      // Last update timestamp
  syncedAt: Date        // Last sync timestamp
}
```

### Products Collection

```javascript
{
  id: Number,              // WooCommerce product ID
  name: String,            // Product name
  sku: String,             // Product SKU
  price: Number,           // Current price
  regular_price: Number,   // Regular price
  sale_price: Number,      // Sale price
  description: String,     // Product description
  short_description: String, // Short description
  images: Array,           // Product images
  stock_quantity: Number,  // Stock quantity
  in_stock: Boolean,       // Stock status
  updatedAt: Date,         // Last update timestamp
  syncedAt: Date           // Last sync timestamp
}
```

## Error Handling

The API implements comprehensive error handling:

- **Validation Errors**: 400 Bad Request
- **Not Found**: 404 Not Found
- **Conflict**: 409 Conflict (duplicate entries)
- **Rate Limiting**: 429 Too Many Requests
- **Server Errors**: 500 Internal Server Error

All errors are logged with Winston and include:

- Error message and stack trace
- Request information (URL, method, IP)
- Timestamp and severity level

## Logging

Logs are written to:

- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console output in development

## Performance Optimizations

- **Database Indexing**: Optimized indexes for search and filtering
- **Connection Pooling**: MongoDB connection pooling
- **Compression**: Gzip compression for responses
- **Rate Limiting**: Prevents API abuse
- **Caching**: Intelligent product caching to avoid duplicates

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Joi validation for all inputs
- **Error Sanitization**: Sanitized error responses

## Deployment

The application is ready for deployment on platforms like:

- Heroku
- AWS EC2/ECS
- Google Cloud Platform
- DigitalOcean

### Production Considerations

1. **Database**: Use MongoDB Atlas for production
2. **Environment**: Set `NODE_ENV=production`
3. **Process Management**: Use PM2 for process management
4. **Monitoring**: Implement health checks and monitoring
5. **Backup**: Regular database backups

## Known Limitations

1. **Rate Limiting**: WooCommerce API rate limits may affect large syncs
2. **Memory Usage**: Large datasets may require memory optimization
3. **Timezone**: All dates are stored in UTC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Run the test suite
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
