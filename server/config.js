// Server configuration settings
import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  database: {
    initializeTables: true,
    dropAllTables: false
  }
};

export default config;