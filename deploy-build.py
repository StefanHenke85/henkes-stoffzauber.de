#!/usr/bin/env python3
import os
import subprocess

SERVER = "81.7.11.191"
USER = "root"
PASSWORD = "o6gZZqiM"
REMOTE_PATH = "/var/www/henkes-stoffzauber.de/web"

print("📦 Deploying build to production server...\n")

try:
    print("1️⃣ Copying build files...")

    # Use pscp (PuTTY SCP) on Windows
    upload_cmd = f'echo {PASSWORD} | pscp -pw {PASSWORD} -r web\\dist {USER}@{SERVER}:{REMOTE_PATH}/'

    # Alternative: Create a batch file
    batch_script = f"""@echo off
echo Uploading build...
pscp -pw {PASSWORD} -r web\\dist {USER}@{SERVER}:{REMOTE_PATH}/
if %ERRORLEVEL% EQU 0 (
    echo Upload successful!
    plink -pw {PASSWORD} {USER}@{SERVER} "cd {REMOTE_PATH} && echo 'Build deployed'"
) else (
    echo Upload failed!
    exit /b 1
)
"""

    with open('deploy_temp.bat', 'w') as f:
        f.write(batch_script)

    result = subprocess.run(['deploy_temp.bat'], shell=True, capture_output=True, text=True)

    if result.returncode == 0:
        print("\n✅ Build deployed successfully!")
        print("🔗 Visit: https://henkes-stoffzauber.de\n")
    else:
        print(f"\n❌ Deployment failed: {result.stderr}")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if os.path.exists('deploy_temp.bat'):
        os.remove('deploy_temp.bat')
