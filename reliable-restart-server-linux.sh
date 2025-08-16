#!/bin/bash

# Linux环境下可靠重启Node.js服务器脚本
# 当常规重启脚本失败时使用，包含多种停止和启动机制

# 设置基本参数
APP_NAME="app.js"
APP_PORT="3000"
LOG_DIR="logs"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="${LOG_DIR}/server_restart_${TIMESTAMP}.log"
PID_FILE="server.pid"

# 确保日志目录存在
mkdir -p $LOG_DIR

# 函数: 记录日志
echo_log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message"
    echo "$message" >> $LOG_FILE
}

# 函数: 检查进程是否在运行
is_process_running() {
    local pid=$1
    ps -p $pid >/dev/null 2>&1
}

# 函数: 检查端口是否被占用
is_port_used() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :$port >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep :$port >/dev/null 2>&1
    else
        # 如果都没有，默认返回false
        return 1
    fi
}

# 开始重启过程
echo_log "开始可靠重启Node.js服务器..."

# 步骤1: 停止现有服务
echo_log "\n步骤1: 停止现有服务"

# 尝试使用常规停止脚本
if [ -f "stop-server-linux.js" ]; then
    echo_log "尝试使用常规停止脚本 stop-server-linux.js..."
    node stop-server-linux.js >> $LOG_FILE 2>&1
    if [ $? -eq 0 ]; then
        echo_log "常规停止脚本执行成功"
    else
        echo_log "警告: 常规停止脚本执行失败，尝试强制停止..."
    fi
fi

# 等待2秒
sleep 2

# 检查是否还有服务在运行
if is_process_running $(cat $PID_FILE 2>/dev/null) || is_port_used $APP_PORT || pgrep node >/dev/null; then
    echo_log "检测到仍有服务进程在运行，执行强制停止..."
    
    # 尝试使用我们刚创建的强制停止脚本
    if [ -f "force-stop-server-linux.sh" ]; then
        chmod +x force-stop-server-linux.sh
        ./force-stop-server-linux.sh >> $LOG_FILE 2>&1
    else
        echo_log "警告: 强制停止脚本不存在，使用备用强制停止方法..."
        
        # 备用强制停止方法1: 杀死所有node进程
        echo_log "使用备用方法 - 杀死所有node进程..."
        pkill -f node >> $LOG_FILE 2>&1
        sleep 1
        
        # 备用强制停止方法2: 使用killall（如果可用）
        if command -v killall >/dev/null 2>&1; then
            echo_log "使用killall命令..."
            killall node >> $LOG_FILE 2>&1
            sleep 1
        fi
        
        # 备用强制停止方法3: 手动查找并杀死
        echo_log "手动查找并杀死剩余的node进程..."
        ps aux | grep node | grep -v grep | awk '{print $2}' | xargs -r kill -9 >> $LOG_FILE 2>&1
    fi
fi

# 等待3秒，确保所有进程都已终止
sleep 3

# 验证停止是否成功
if is_port_used $APP_PORT || pgrep node >/dev/null; then
    echo_log "错误: 无法完全停止现有服务！请手动检查并杀死剩余进程。"
    echo_log "尝试使用sudo权限: sudo pkill -f node"
    exit 1
else
    echo_log "✓ 现有服务已成功停止"
fi

# 步骤2: 启动新服务
echo_log "\n步骤2: 启动新服务"

# 清除旧的PID文件
rm -f $PID_FILE

# 启动服务的主要方法
echo_log "正在启动服务..."

# 方法1: 使用nohup在后台启动服务
if command -v nohup >/dev/null 2>&1; then
    echo_log "使用nohup启动服务..."
    nohup node $APP_NAME >> "${LOG_DIR}/server_${TIMESTAMP}.log" 2>&1 &
    SERVER_PID=$!
    
    # 记录PID到文件
    echo $SERVER_PID > $PID_FILE
    echo_log "服务已启动，PID: $SERVER_PID，日志文件: ${LOG_DIR}/server_${TIMESTAMP}.log"
else
    echo_log "警告: nohup命令不可用，使用备用启动方法..."
    
    # 方法2: 使用setsid在后台启动服务
    if command -v setsid >/dev/null 2>&1; then
        echo_log "使用setsid启动服务..."
        setsid node $APP_NAME >> "${LOG_DIR}/server_${TIMESTAMP}.log" 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > $PID_FILE
        echo_log "服务已启动，PID: $SERVER_PID"
    else
        echo_log "警告: setsid命令也不可用，使用标准后台启动..."
        
        # 方法3: 标准后台启动
        node $APP_NAME >> "${LOG_DIR}/server_${TIMESTAMP}.log" 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > $PID_FILE
        echo_log "服务已启动，PID: $SERVER_PID"
    fi
fi

# 等待服务初始化
sleep 5

# 验证服务是否成功启动
if is_process_running $SERVER_PID && is_port_used $APP_PORT; then
    echo_log "✓ 服务已成功重启并运行在端口 $APP_PORT"
    echo_log "服务状态: 运行中，PID: $SERVER_PID"
    echo_log "访问地址: http://localhost:$APP_PORT"
else
    echo_log "错误: 服务启动失败或未正常监听端口 $APP_PORT"
    echo_log "查看日志了解详情: cat ${LOG_DIR}/server_${TIMESTAMP}.log"
    exit 1
fi

# 打印重启总结
echo_log "\n服务重启总结:"
echo_log "- 原有服务已停止"
echo_log "- 新服务已启动，PID: $SERVER_PID"
echo_log "- 服务日志: ${LOG_DIR}/server_${TIMESTAMP}.log"
echo_log "- 重启脚本日志: $LOG_FILE"
echo_log "- 服务运行在端口: $APP_PORT"

echo_log "\n重启过程完成！"