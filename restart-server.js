import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 重启Node.js服务器
 * 该脚本会先停止运行中的服务器，然后重新启动它
 */
async function restartServer() {
  try {
    console.log('开始重启服务器...');
    
    // 1. 先停止正在运行的服务器
    console.log('步骤1: 停止现有服务器...');
    
    try {
      // 查找运行app.js的Node.js进程
      const { stdout } = await execAsync('tasklist /fi "IMAGENAME eq node.exe" /v', {
        windowsHide: true
      });
      
      // 在Windows上查找Node进程
      const lines = stdout.split('\n');
      const nodeProcesses = [];
      
      lines.forEach(line => {
        if (line.includes('node.exe') && line.includes('app.js')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[1];
          nodeProcesses.push(pid);
        }
      });
      
      // 终止所有找到的进程
      for (const pid of nodeProcesses) {
        try {
          await execAsync(`taskkill /PID ${pid} /F`, {
            windowsHide: true
          });
          console.log(`已成功终止进程 ${pid}`);
        } catch (killError) {
          console.error(`终止进程 ${pid} 失败:`, killError.message);
        }
      }
      
      // 备用方法：通过端口号停止服务
      try {
        const { stdout: netstatOutput } = await execAsync('netstat -ano | findstr :3000', {
          windowsHide: true
        });
        const portLines = netstatOutput.split('\n');
        if (portLines.length > 0) {
          const lastLine = portLines[portLines.length - 2]; // 最后一行通常是空的
          const portPid = lastLine.trim().split(/\s+/).pop();
          if (portPid && !isNaN(portPid) && !nodeProcesses.includes(portPid)) {
            await execAsync(`taskkill /PID ${portPid} /F`, {
              windowsHide: true
            });
            console.log(`已通过端口3000终止进程 ${portPid}`);
          }
        }
      } catch (portError) {
        // 端口未被占用，不需要处理
      }
      
    } catch (stopError) {
      console.error('停止服务器时发生错误:', stopError.message);
      // 继续尝试启动新服务器
    }
    
    // 等待几秒钟确保进程完全终止
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. 启动新的服务器
    console.log('步骤2: 启动新服务器...');
    
    // 在新的终端中启动服务器，并将输出重定向到日志文件
    const logFile = path.join(__dirname, 'server.log');
    
    // 注意：在Windows上，我们需要使用不同的方式来启动后台进程
    // 这里我们使用start命令在新窗口中启动服务
    execAsync(`start cmd.exe /k "node app.js > ${logFile} 2>&1"`, {
      windowsHide: true
    }).then(() => {
      console.log('服务器已在新窗口中启动');
      console.log('服务器日志已保存到:', logFile);
      console.log('重启服务器完成');
      process.exit(0);
    }).catch(startError => {
      console.error('启动服务器失败:', startError.message);
      
      // 备用启动方式：直接在当前进程中启动
      try {
        console.log('尝试在当前进程中启动服务器...');
        const { stdout, stderr } = exec('node app.js', {
          windowsHide: false
        });
        
        stdout.on('data', (data) => {
          console.log(`服务器输出: ${data}`);
        });
        
        stderr.on('data', (data) => {
          console.error(`服务器错误: ${data}`);
        });
        
        console.log('服务器已启动');
        console.log('重启服务器完成');
      } catch (fallbackError) {
        console.error('所有启动服务器的尝试都失败了:', fallbackError.message);
        process.exit(1);
      }
    });
    
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