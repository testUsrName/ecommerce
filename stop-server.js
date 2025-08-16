import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 停止运行中的Node.js服务器
 * 该脚本会查找运行app.js的进程并终止它
 */
async function stopServer() {
  try {
    console.log('正在查找并停止Node.js服务器...');
    
    // 查找运行app.js的Node.js进程
    const { stdout, stderr } = await execAsync('tasklist /fi "IMAGENAME eq node.exe" /v', {
      windowsHide: true
    });
    
    // 在Windows上查找Node进程
    const lines = stdout.split('\n');
    const nodeProcesses = [];
    
    lines.forEach(line => {
      if (line.includes('node.exe') && line.includes('app.js')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const cmdLine = line;
        nodeProcesses.push({ pid, cmdLine });
      }
    });
    
    if (nodeProcesses.length === 0) {
      console.log('未找到运行app.js的Node.js进程');
      return;
    }
    
    console.log(`找到 ${nodeProcesses.length} 个运行app.js的进程:`);
    nodeProcesses.forEach((proc, index) => {
      console.log(`${index + 1}. PID: ${proc.pid}`);
    });
    
    // 终止所有找到的进程
    for (const proc of nodeProcesses) {
      try {
        await execAsync(`taskkill /PID ${proc.pid} /F`, {
          windowsHide: true
        });
        console.log(`已成功终止进程 ${proc.pid}`);
      } catch (killError) {
        console.error(`终止进程 ${proc.pid} 失败:`, killError.message);
      }
    }
    
    console.log('服务器停止完成');
    
  } catch (error) {
    console.error('停止服务器时发生错误:', error.message);
    
    // 备用方法：尝试通过端口号停止服务
    try {
      console.log('尝试通过端口号停止服务...');
      await execAsync('netstat -ano | findstr :3000', {
        windowsHide: true
      }).then(({ stdout }) => {
        const lines = stdout.split('\n');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 2]; // 最后一行通常是空的
          const pid = lastLine.trim().split(/\s+/).pop();
          if (pid && !isNaN(pid)) {
            execAsync(`taskkill /PID ${pid} /F`, {
              windowsHide: true
            });
            console.log(`已通过端口3000终止进程 ${pid}`);
          }
        }
      });
    } catch (portError) {
      console.error('通过端口停止服务失败:', portError.message);
    }
  }
}

// 执行停止服务器函数
stopServer().catch(err => {
  console.error('程序执行失败:', err);
  process.exit(1);
});