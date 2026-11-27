import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoPath = path.resolve(__dirname, '..');
const pkgPath = path.join(repoPath, 'package.json');
const lockPath = path.join(repoPath, 'package-lock.json');

const registries = ['https://registry.npmjs.org', 'https://registry.npmmirror.com'];

const bumpPatchVersion = (version) => {
  const parts = version.split('.').map((num) => parseInt(num, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`无法解析版本号: ${version}`);
  }
  parts[2] += 1;
  return parts.join('.');
};

const fetchPublishedVersions = async (registry, name) => {
  try {
    const { data } = await axios.get(`${registry}/${encodeURIComponent(name)}`);
    return data && data.versions ? Object.keys(data.versions) : [];
  } catch (error) {
    // 404 表示包从未发布，按线上仅有 0.0.0 参与已发布比较
    if (error.response && error.response.status === 404) return ['0.0.0'];
    throw error;
  }
};

const isVersionPublished = async (name, version) => {
  let lastError;
  for (const registry of registries) {
    try {
      const versions = await fetchPublishedVersions(registry, name);
      return versions.includes(version);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const updateLockFile = (nextVersion) => {
  if (!existsSync(lockPath)) return;
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const entry = lock.packages && lock.packages[''];
  if (entry) {
    entry.version = nextVersion;
    lock.version = nextVersion;
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  }
};

const main = async () => {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const published = await isVersionPublished(pkg.name, pkg.version);
  if (!published) {
    console.log(`${pkg.name} 线上不存在版本 ${pkg.version}，无需递增`);
    return;
  }
  const nextVersion = bumpPatchVersion(pkg.version);
  pkg.version = nextVersion;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  updateLockFile(nextVersion);
  console.log(`${pkg.name} 版本号已自动递增至 ${nextVersion}`);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
