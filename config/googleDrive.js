/**
 * Google Drive Integration Configuration
 * Purpose: Handles connection to Google Drive API for backup functionality
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 *
 * How to use:
 * 1. Set up Google OAuth 2.0 credentials in Google Developer Console
 * 2. Add required environment variables in .env file
 * 3. Use the exported functions to interact with Google Drive
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials
const setCredentials = () => {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
};

// Initialize Drive API
const initDrive = () => {
  setCredentials();
  return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Create a backup folder if it doesn't exist
 * @param {string} folderName - Name of the folder
 * @returns {Promise<string>} - Folder ID
 */
const createBackupFolder = async (folderName = 'CollegeElectionBackup') => {
  try {
    const drive = initDrive();

    // Check if folder exists
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error creating backup folder:', error);
    throw error;
  }
};

/**
 * Upload a file to Google Drive
 * @param {string} filePath - Local path of the file to upload
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<object>} - Upload result
 */
const uploadFileToDrive = async (filePath, folderId) => {
  try {
    const drive = initDrive();
    const fileName = path.basename(filePath);

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink'
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
};

/**
 * Create a backup of database data and upload to Google Drive
 * @param {object} data - Data to backup
 * @param {string} fileName - Name for the backup file
 * @returns {Promise<object>} - Backup result
 */
const createDataBackup = async (data, fileName = `backup-${Date.now()}.json`) => {
  try {
    // Create temp file
    const tempFilePath = path.join(__dirname, '..', 'uploads', fileName);
    fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2));

    // Create or get folder
    const folderId = await createBackupFolder();

    // Upload file
    const uploadResult = await uploadFileToDrive(tempFilePath, folderId);

    // Delete temp file
    fs.unlinkSync(tempFilePath);

    return {
      success: true,
      fileId: uploadResult.id,
      fileName: uploadResult.name,
      link: uploadResult.webViewLink
    };
  } catch (error) {
    console.error('Error creating data backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createBackupFolder,
  uploadFileToDrive,
  createDataBackup
};
