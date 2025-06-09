// server.js
require('dotenv').config();
const express = require('express');

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swaggerConfig");

const morgan = require('morgan'); // Import morgan for logging
const helmet = require('helmet'); // Import helmet for security
const routes = require('./routes/index');
const bodyParser = require('body-parser'); // Import body-parser for parsing JSON
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const { sequelize } = require('./models/index');
const PORT = process.env.PORT;

// Middleware
app.use(express.json()); // For parsing application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // Use morgan for logging
app.use(cookieParser())
app.use(helmet());
app.use(morgan('combined')); // Log requests to the console

const allowedOrigins = [
    'http://localhost:3000', 
    'http://192.168.100.84:3000',
    'http://192.168.100.86:3000'
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow all necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  
// app.use(cors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     credentials: true,
//     // allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(cors());


// Swagger Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use(routes); 

// Function to start the server after syncing the database
async function startServer() {
    try {
        // Sync the database (force: false means it won't drop existing tables)
        await sequelize.sync({ force : false });
        console.log('Database synced successfully');


        console.log('Registered routes:');
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(middleware.route.path);
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((nested) => {
            if (nested.route) {
                console.log(nested.route.path);
            }
        });
    }
});


        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server: ', error);
    }
}

require('./jobs/payrollCron'); // Starts cron jobs


// Start the server
startServer();
