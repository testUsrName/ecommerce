# 阿里云Linux服务器服务管理指南

本指南提供在阿里云服务器(Alibaba Cloud Linux)上停止和重启Node.js电商网站服务的方法，特别是当常规脚本失败时的备用方案。

## 一、快速参考

### 停止服务

**常规方法 (推荐):**
```bash
# 使用我们创建的强制停止脚本
chmod +x force-stop-server-linux.sh
./force-stop-server-linux.sh
```

**备用命令 (当脚本不可用):**
```bash
# 方法1: 查找并杀死特定app.js进程
sudo ps aux | grep "[n]ode app.js" | awk '{print $2}' | xargs -r sudo kill -9

# 方法2: 杀死所有Node.js进程
sudo pkill -f node

# 方法3: 使用killall命令
sudo killall node

# 方法4: 查找并杀死占用3000端口的进程
sudo lsof -i :3000 -t | xargs -r sudo kill -9
```

### 重启服务

**常规方法 (推荐):**
```bash
# 使用我们创建的可靠重启脚本
chmod +x reliable-restart-server-linux.sh
./reliable-restart-server-linux.sh
```

**备用命令 (手动重启):**
```bash
# 1. 先停止所有Node进程
sudo pkill -f node

# 2. 等待几秒钟
sleep 3

# 3. 在后台启动服务并记录日志
nohup node app.js >> logs/server.log 2>&1 &

# 4. 记录进程ID
echo $! > server.pid
```

## 二、详细说明

### 脚本说明

1. **force-stop-server-linux.sh**
   - 功能：强制停止所有Node.js相关进程，特别针对app.js
   - 特点：包含3种不同的进程查找和终止方法
   - 适用场景：当常规stop脚本失败或无法找到进程时

2. **reliable-restart-server-linux.sh**
   - 功能：可靠地重启服务，包括强制停止现有进程和启动新进程
   - 特点：
     - 自动检测服务状态
     - 多级停止机制确保彻底终止
     - 多种启动方式确保成功启动
     - 详细的日志记录
   - 适用场景：需要确保服务能够可靠重启的情况

### 常见问题与解决方案

**问题1: 找不到运行app.js的Node.js进程**

解决方案:
- 使用`ps aux | grep node`查看所有Node进程
- 使用`sudo lsof -i :3000`检查端口占用情况
- 使用`pkill -f node`强制终止所有Node进程

**问题2: 端口3000被占用但找不到进程**

解决方案:
```bash
# 查看端口占用情况
sudo netstat -tuln | grep :3000

# 找到并杀死占用端口的进程
sudo fuser -k 3000/tcp
```

**问题3: 权限不足无法终止进程**

解决方案:
- 使用sudo权限执行命令，例如：`sudo pkill -f node`

**问题4: 服务启动后很快崩溃**

解决方案:
- 检查日志文件：`cat logs/server.log`
- 查看错误信息并修复问题
- 确保所有依赖都已安装：`npm install`

## 三、服务监控建议

为了避免服务管理问题，建议在阿里云服务器上设置以下监控和自动化:

1. **设置开机自启动**
   ```bash
   # 使用systemd设置服务自启动
   # 创建服务文件
sudo nano /etc/systemd/system/ecommerce.service
   ```

   文件内容示例:
   ```
   [Unit]
   Description=Ecommerce Website
   After=network.target
   
   [Service]
   Type=simple
   WorkingDirectory=/path/to/ecommerce
   ExecStart=/usr/bin/node app.js
   Restart=on-failure
   User=your_username
   
   [Install]
   WantedBy=multi-user.target
   ```

   启用服务:
   ```bash
sudo systemctl daemon-reload
sudo systemctl enable ecommerce
sudo systemctl start ecommerce
   ```

2. **监控服务状态**
   ```bash
   # 检查服务状态
sudo systemctl status ecommerce
   
   # 查看服务日志
sudo journalctl -u ecommerce
   ```

3. **定期检查日志**
   - 设置cron任务定期检查服务状态和日志文件

## 四、紧急联系方式

如果遇到无法解决的服务问题，请联系技术支持或系统管理员。

---

创建时间: $(date '+%Y-%m-%d %H:%M:%S')
适用于: Alibaba Cloud Linux系统上的Node.js电商网站服务