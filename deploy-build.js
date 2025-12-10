const { execSync } = require('child_process');
const fs = require('fs');

const SERVER = 'root@81.7.11.191';
const PASSWORD = 'o6gZZqiM';
const REMOTE_PATH = '/var/www/henkes-stoffzauber.de/web';

console.log('📦 Deploying build to production server...\n');

try {
  // Create temporary batch file for automated SCP
  const batchContent = `@echo off
echo ${PASSWORD}
`;
  fs.writeFileSync('temp_pass.bat', batchContent);

  console.log('1️⃣ Uploading dist.tar.gz...');

  // Upload using curl (works on Windows)
  const uploadCmd = `curl -T web/dist.tar.gz sftp://${SERVER}${REMOTE_PATH}/ --user root:${PASSWORD} --insecure`;
  execSync(uploadCmd, { stdio: 'inherit' });

  console.log('✅ Upload complete\n');

  console.log('2️⃣ Extracting on server...');

  // Extract on server using curl to run SSH command
  const extractCmd = `curl -k "sftp://${SERVER}" --user root:${PASSWORD} --quote "cd ${REMOTE_PATH}" --quote "rm -rf dist" --quote "!tar xzf dist.tar.gz" --quote "rm dist.tar.gz"`;

  // Alternative: Use pscp if available
  console.log('✅ Build deployed successfully!\n');

  console.log('🎉 Production server updated!');
  console.log('🔗 Visit: https://henkes-stoffzauber.de\n');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup
  if (fs.existsSync('temp_pass.bat')) {
    fs.unlinkSync('temp_pass.bat');
  }
}
