const AGENT_MIN_NODE_VERSION = 22;

const parseVersion = (version = '') =>
  version
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number(part || 0));

const isVersionLessThan = (current, target) => {
  const currentParts = parseVersion(current);
  const targetParts = parseVersion(target);
  for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i += 1) {
    const currentPart = currentParts[i] || 0;
    const targetPart = targetParts[i] || 0;
    if (currentPart < targetPart) return true;
    if (currentPart > targetPart) return false;
  }
  return false;
};

// git agent 占位命令：Node < 22 提示版本过低；Node >= 22 提示功能尚未开放
export default async function () {
  if (isVersionLessThan(process.versions.node, `${AGENT_MIN_NODE_VERSION}.0.0`)) {
    console.error(
      `当前 Node.js 版本为 ${process.version}，git agent 需要 Node.js ${AGENT_MIN_NODE_VERSION} 或更高版本，请升级 Node.js 后再使用。`
    );
    process.exit(1);
  }
  console.log('git agent 功能尚未开放，敬请期待');
}
