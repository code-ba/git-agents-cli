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

// 统一入口命令清单：git agent 仅在 Node >= 22 时展示
export default async function () {
  const lines = [
    'git-agents-cli 统一入口，可用命令：',
    '  git ai        生成并提交（@git-ai/core）',
    '  git clear     清理被 .gitignore 忽略却已提交的文件（@git-ai/clean）',
    '  git gpg       GPG 密钥管理（@git-ai/gpg）',
  ];
  if (!isVersionLessThan(process.versions.node, `${AGENT_MIN_NODE_VERSION}.0.0`)) {
    lines.push('  git agent     终端智能体（@git-agent/cli，需要 Node.js >= 22，尚未开放）');
  }
  console.log(lines.join('\n'));
}
