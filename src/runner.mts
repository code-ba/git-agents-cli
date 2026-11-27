import { existsSync, readFileSync } from 'fs';
import { execSync, spawn } from 'child_process';
import readline from 'readline';
import path from 'path';

let globalRoot;
const getGlobalRoot = () => {
  if (!globalRoot) {
    // stderr 一并忽略，避免 npm 的配置警告混进输出
    globalRoot = execSync('npm root -g', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  }
  return globalRoot;
};

const isGloballyInstalled = (pkgName) => {
  try {
    return existsSync(path.join(getGlobalRoot(), ...pkgName.split('/')));
  } catch (error) {
    return false;
  }
};

// y/n 确认，默认 y；stdin 不是 TTY（如 CI）时等同 n
const promptYesNo = (message) =>
  new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve(false);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${message}（y/n，默认 y）：`, (answer) => {
      rl.close();
      resolve(!answer || answer.trim().toLowerCase() === 'y');
    });
  });

const installGlobal = (pkgName) => {
  // 全局安装（命令用数组拼接，语义与 npm install -g 一致）
  execSync(['npm', 'install', '-g', pkgName].join(' '), { stdio: 'inherit' });
};

// 读取已安装包的入口文件并用子进程运行，不依赖它的 bin 名（避免与转发 bin 同名冲突）
const runInstalled = (pkgName, args) => {
  const pkgDir = path.join(getGlobalRoot(), ...pkgName.split('/'));
  const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin && pkg.bin[Object.keys(pkg.bin)[0]];
  const entry = path.join(pkgDir, bin || pkg.main || 'dist/index.mjs');
  const child = spawn(process.execPath, [entry, ...args], { stdio: 'inherit' });
  child.on('close', (code) => {
    process.exit(code || 0);
  });
};

// 运行指定包：全局未装则提示安装（默认 y，n 不装），已装或装好后运行并透传参数
export const runPackage = async (pkgName, args = []) => {
  if (!isGloballyInstalled(pkgName)) {
    const confirmed = await promptYesNo(`首次运行需要安装 ${pkgName}`);
    if (!confirmed) {
      console.error(`未安装 ${pkgName}，该命令不可用`);
      process.exit(1);
    }
    try {
      installGlobal(pkgName);
    } catch (error) {
      console.error(`安装 ${pkgName} 失败：${error && error.message ? error.message : error}`);
      process.exit(1);
    }
  }
  runInstalled(pkgName, args);
};
