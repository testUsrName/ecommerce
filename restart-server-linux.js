import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 重启Node.js服务器（Linux环境）
 * 该脚本会先停止正在运行的服务器，然后在后台重新启动它
 */
async function restartServer() {
  try {
    console.log('开始重启服务器...');
    
    // 1. 先停止正在运行的服务器
    console.log('步骤1: 停止现有服务器...');
    
    try {
      // 使用我们创建的Linux停止脚本
      await execAsync('node stop-server-linux.js');
    } catch (stopError) {
      console.error('调用停止脚本失败，尝试手动停止...:', stopError.message);
      
      // 手动停止服务器进程
      try {
        // 查找并终止Node进程
        await execAsync('pkill -f "node app.js"');
        console.log('已使用pkill终止Node进程');
      } catch (manualStopError) {
        console.error('手动停止服务器失败:', manualStopError.message);
        // 继续尝试启动新服务器
      }
    }
    
    // 等待几秒钟确保进程完全终止
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. 启动新的服务器
    console.log('步骤2: 启动新服务器...');
    
    // 创建日志目录（如果不存在）
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    // 设置日志文件路径
    const logFile = path.join(logDir, `server-${new Date().toISOString().split('T')[0]}.log`);
    const errorLogFile = path.join(logDir, `server-error-${new Date().toISOString().split('T')[0]}.log`);
    
    // 打开日志文件
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    const errorStream = fs.createWriteStream(errorLogFile, { flags: 'a' });
    
    // 添加日志头部信息
    const logHeader = `\n===== 服务器启动于 ${new Date().toISOString()} =====\n`;
    logStream.write(logHeader);
    errorStream.write(logHeader);
    
    // 在后台启动服务器进程
    const serverProcess = spawn('node', ['app.js'], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // 将输出重定向到日志文件
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`服务器输出: ${output}`);
      logStream.write(output);
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`服务器错误: ${output}`);
      errorStream.write(output);
    });
    
    serverProcess.on('close', (code) => {
      const exitMsg = `服务器进程已退出，退出码: ${code}\n`;
      console.log(exitMsg);
      logStream.write(exitMsg);
      errorStream.write(exitMsg);
      logStream.end();
      errorStream.end();
    });
    
    // 分离进程，使其在后台运行
    serverProcess.unref();
    
    console.log('服务器已在后台启动');
    console.log('标准输出日志已保存到:', logFile);
    console.log('错误日志已保存到:', errorLogFile);
    console.log('重启服务器完成');
    
    // 记录进程ID到文件，方便后续管理
    const pidFile = path.join(__dirname, 'server.pid');
    fs.writeFileSync(pidFile, serverProcess.pid.toString());
    console.log(`服务器进程ID (${serverProcess.pid}) 已保存到: ${pidFile}`);
    
    // 延迟退出，确保服务器启动成功
    setTimeout(() => {
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('重启服务器时发生严重错误:', error);
    process.exit(1);
  }
}

// 执行重启服务器函数
restartServer().catch(err => {
  console.error('程序执行失败:', err);
  process.exit(1);
});