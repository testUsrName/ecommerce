import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 停止运行中的Node.js服务器（Linux环境）
 * 该脚本会查找运行app.js的进程并终止它
 */
async function stopServer() {
  try {
    console.log('正在查找并停止Node.js服务器...');
    
    // 在Linux上查找运行app.js的Node.js进程
    const { stdout } = await execAsync('ps aux | grep "[n]ode app.js"');
    
    const lines = stdout.trim().split('\n');
    const nodeProcesses = [];
    
    lines.forEach(line => {
      if (line.includes('node app.js')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        nodeProcesses.push(pid);
      }
    });
    
    if (nodeProcesses.length === 0) {
      console.log('未找到运行app.js的Node.js进程');
      // 尝试备用方法查找
      try {
        const { stdout: altStdout } = await execAsync('ps aux | grep "node" | grep -v "grep"');
        const altLines = altStdout.trim().split('\n');
        if (altLines.length > 0) {
          console.log('找到以下Node.js进程：');
          altLines.forEach(line => console.log(line));
        }
      } catch (altError) {
        // 忽略备用方法的错误
      }
      return;
    }
    
    console.log(`找到 ${nodeProcesses.length} 个运行app.js的进程:`);
    nodeProcesses.forEach((pid, index) => {
      console.log(`${index + 1}. PID: ${pid}`);
    });
    
    // 终止所有找到的进程
    for (const pid of nodeProcesses) {
      try {
        await execAsync(`kill -9 ${pid}`);
        console.log(`已成功终止进程 ${pid}`);
      } catch (killError) {
        console.error(`终止进程 ${pid} 失败:`, killError.message);
      }
    }
    
    // 备用方法：通过端口号停止服务
    try {
      const { stdout: netstatOutput } = await execAsync('netstat -tuln | grep :3000');
      if (netstatOutput.trim()) {
        console.log('发现端口3000被占用，尝试通过端口停止服务...');
        const { stdout: lsofOutput } = await execAsync('lsof -i :3000 | grep LISTEN');
        const portLine = lsofOutput.trim().split('\n')[0];
        if (portLine) {
          const portPid = portLine.split(/\s+/)[1];
          if (portPid && !isNaN(portPid) && !nodeProcesses.includes(portPid)) {
            await execAsync(`kill -9 ${portPid}`);
            console.log(`已通过端口3000终止进程 ${portPid}`);
          }
        }
      }
    } catch (portError) {
      // 忽略端口检查错误
    }
    
    console.log('服务器停止完成');
    
  } catch (error) {
    console.error('停止服务器时发生错误:', error.message);
    
    // 尝试使用pgrep命令作为备选方案
    try {
      console.log('尝试使用pgrep命令查找Node.js进程...');
      const { stdout: pgrepOutput } = await execAsync('pgrep -f "node app.js"');
      const pids = pgrepOutput.trim().split('\n').filter(pid => pid);
      
      if (pids.length > 0) {
        console.log(`通过pgrep找到 ${pids.length} 个进程`);
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            console.log(`已终止进程 ${pid}`);
          } catch (pgrepKillError) {
            console.error(`终止进程 ${pid} 失败:`, pgrepKillError.message);
          }
        }
      } else {
        console.log('pgrep也未找到相关进程');
      }
    } catch (pgrepError) {
      console.error('pgrep命令执行失败:', pgrepError.message);
    }
  }
}

// 执行停止服务器函数
stopServer().catch(err => {
  console.error('程序执行失败:', err);
  process.exit(1);
});