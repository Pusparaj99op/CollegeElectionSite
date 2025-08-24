/**
 * Port Manager for College Election System
 * Purpose: Helper script to manage ports and handle port conflicts
 * Version: 1.0.0
 * Last Modified: August 1, 2025
 * Project Version: 2.0.0
 */

const net = require('net');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ports to check
const PRIMARY_PORT = 3000;
const BACKUP_PORT = 3001;

/**
 * Check if a port is in use
 * @param {number} port - The port number to check
 * @returns {Promise<boolean>} - True if port is in use, false otherwise
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

/**
 * Find an available port starting from preferredPort
 * @param {number} preferredPort - Port to start checking from
 * @returns {Promise<number>} - First available port
 */
async function findAvailablePort(preferredPort) {
  let port = preferredPort;
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying next port...`);
    port++;
  }
  return port;
}

/**
 * Kill process on specified port
 * @param {number} port - Port number to free
 * @returns {Promise<void>}
 */
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    console.log(`Attempting to kill processes on port ${port}...`);

    if (process.platform === 'win32') {
      // Windows command
      exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid) {
              exec(`taskkill /F /PID ${pid}`);
            }
          });
        }
        resolve();
      });
    } else {
      // Unix/Linux/Mac command
      exec(`lsof -i :${port} -t`, (error, stdout) => {
        if (stdout) {
          const pids = stdout.trim().split('\n');
          pids.forEach(pid => {
            if (pid) {
              exec(`kill -9 ${pid}`);
            }
          });
        }
        resolve();
      });
    }
  });
}

/**
 * Main function to manage ports
 */
async function managePort() {
  // Check if PRIMARY_PORT is available
  if (await isPortInUse(PRIMARY_PORT)) {
    console.log(`Primary port ${PRIMARY_PORT} is in use`);

    // Try to kill the process on PRIMARY_PORT
    await killProcessOnPort(PRIMARY_PORT);

    // Check again after killing
    if (await isPortInUse(PRIMARY_PORT)) {
      console.log(`Could not free port ${PRIMARY_PORT}, checking backup port...`);

      // Check if BACKUP_PORT is available
      if (await isPortInUse(BACKUP_PORT)) {
        console.log(`Backup port ${BACKUP_PORT} is also in use`);

        // Try to kill process on backup port
        await killProcessOnPort(BACKUP_PORT);

        if (await isPortInUse(BACKUP_PORT)) {
          // Find first available port
          const availablePort = await findAvailablePort(BACKUP_PORT + 1);
          console.log(`Using next available port: ${availablePort}`);
          process.env.PORT = availablePort;
        } else {
          console.log(`Successfully freed backup port ${BACKUP_PORT}`);
          process.env.PORT = BACKUP_PORT;
        }
      } else {
        console.log(`Backup port ${BACKUP_PORT} is available`);
        process.env.PORT = BACKUP_PORT;
      }
    } else {
      console.log(`Successfully freed primary port ${PRIMARY_PORT}`);
      process.env.PORT = PRIMARY_PORT;
    }
  } else {
    console.log(`Primary port ${PRIMARY_PORT} is available`);
    process.env.PORT = PRIMARY_PORT;
  }

  console.log(`Server will start on port ${process.env.PORT}`);
}

// If this script is run directly
if (require.main === module) {
  managePort().catch(console.error);
}

module.exports = { managePort, isPortInUse, killProcessOnPort, findAvailablePort };
