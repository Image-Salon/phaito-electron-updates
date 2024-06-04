const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateSHA512(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('base64')));
        stream.on('error', reject);
    });
}

async function generateYAML(version) {

    const versionClean = version.replace(/^v/, '').trim();

    const releaseDir = path.join(__dirname, '../');
    const latestMacYmlPath = path.join(releaseDir, 'latest-mac.yml');
    if (fs.existsSync(latestMacYmlPath)) {
        console.log();
        throw new Error('latest-mac.yml already exists. No action needed.');
    }

    const zipFile = path.join(releaseDir, `Phaito_${versionClean}.zip`);
    const dmgFile = path.join(releaseDir, `Phaito_${versionClean}.dmg`);

    if (!fs.existsSync(zipFile) || !fs.existsSync(dmgFile)) {
        throw new Error(`Files not found in ${releaseDir}`);
    }

    const zipStats = fs.statSync(zipFile);
    const dmgStats = fs.statSync(dmgFile);
    const zipSHA512 = await calculateSHA512(zipFile);
    const dmgSHA512 = await calculateSHA512(dmgFile);

    const yamlContent = `version: ${versionClean}
files:
  - url: Phaito_${versionClean}.zip
    sha512: ${zipSHA512}
    size: ${zipStats.size}
  - url: Phaito_${versionClean}.dmg
    sha512: ${dmgSHA512}
    size: ${dmgStats.size}
path: Phaito_${versionClean}.zip
sha512: ${zipSHA512}
releaseDate: '${new Date().toISOString()}'`;

    fs.writeFileSync(latestMacYmlPath, yamlContent);
    console.log(`latest-mac.yml generated successfully for version ${versionClean}`);
}

async function main() {
    const version = process.argv[2];

    if (!version) {
        throw new Error('Version and release directory must be specified');
    }

    await generateYAML(version);
}

main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
