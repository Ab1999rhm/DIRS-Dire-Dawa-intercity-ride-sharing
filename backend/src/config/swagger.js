const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DIRS API - Digital Intercity Ride Sharing',
      version: '1.0.0',
      description: 'Production API for Dire Dawa Transportation Ride Sharing System',
      contact: {
        name: 'DIRS Development Team',
        email: 'support@dirs.et'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['passenger', 'driver', 'admin'] },
            isVerified: { type: 'boolean' }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            passenger: { type: 'string' },
            driver: { type: 'string' },
            rideType: { type: 'string', enum: ['intra_city', 'intercity'] },
            status: { type: 'string', enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'] },
            fare: { type: 'object' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            trip: { type: 'string' },
            amount: { type: 'number' },
            method: { type: 'string', enum: ['cash', 'telebirr', 'chapa'] },
            status: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DIRS API Documentation'
  }));

  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger, swaggerSpec };
