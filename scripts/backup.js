const { createDataBackup } = require('../config/googleDrive');
const User = require('../models/User');
const Election = require('../models/Election');
const SystemLog = require('../models/SystemLog');

async function createBackup() {
    try {
        const users = await User.find({});
        const elections = await Election.find({}).populate('candidates');
        const logs = await SystemLog.find({}).limit(1000);

        const backupData = {
            timestamp: new Date(),
            users,
            elections,
            logs
        };

        const result = await createDataBackup(backupData);
        console.log('Backup created:', result);
    } catch (error) {
        console.error('Backup failed:', error);
    }
}

createBackup();
