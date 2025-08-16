#!/bin/bash

# Linux环境下强制停止Node.js服务器脚本
# 当常规停止脚本失败时使用

# 设置要查找的应用名称和端口
APP_NAME="app.js"
APP_PORT="3000"

# 打印当前时间戳
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始强制停止Node.js服务器..."

# 方法1: 使用ps aux和grep查找并停止特定的app.js进程
echo "\n[方法1] 查找特定的$APP_NAME进程:"
PROCESSES=$(ps aux | grep "[n]ode $APP_NAME" | awk '{print $2}')

if [ ! -z "$PROCESSES" ]; then
    echo "找到以下进程: $PROCESSES"
    for PID in $PROCESSES; do
        echo "正在终止进程 $PID..."
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "成功终止进程 $PID"
        else
            echo "终止进程 $PID 失败"
        fi
    done
else
    echo "未找到运行$APP_NAME的特定进程"
fi

# 方法2: 使用pgrep查找所有node进程
echo "\n[方法2] 查找所有Node.js进程:"
NODE_PIDS=$(pgrep node)

if [ ! -z "$NODE_PIDS" ]; then
    echo "找到以下Node.js进程: $NODE_PIDS"
    for PID in $NODE_PIDS; do
        # 检查进程详情，确认是否与我们的应用相关
        PROCESS_CMD=$(ps -p $PID -o cmd=)
        echo "进程 $PID 命令: $PROCESS_CMD"
        
        # 强制终止进程
        echo "正在强制终止进程 $PID..."
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "成功终止进程 $PID"
        else
            echo "终止进程 $PID 失败"
        fi
    done
else
    echo "未找到任何Node.js进程"
fi

# 方法3: 查找占用指定端口的进程
echo "\n[方法3] 查找占用端口$APP_PORT的进程:"

# 优先使用lsof命令
if command -v lsof >/dev/null 2>&1; then
    PORT_PIDS=$(lsof -i :$APP_PORT -t)
    if [ ! -z "$PORT_PIDS" ]; then
        echo "找到以下占用端口$APP_PORT的进程: $PORT_PIDS"
        for PID in $PORT_PIDS; do
            echo "正在终止占用端口$APP_PORT的进程 $PID..."
            kill -9 $PID 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "成功终止进程 $PID"
            else
                echo "终止进程 $PID 失败"
            fi
        done
    else
        echo "未找到占用端口$APP_PORT的进程"
    fi
else
    # 如果没有lsof，尝试使用netstat
    if command -v netstat >/dev/null 2>&1; then
        PORT_INFO=$(netstat -tuln | grep :$APP_PORT)
        if [ ! -z "$PORT_INFO" ]; then
            echo "端口$APP_PORT 状态: $PORT_INFO"
            # 注意：netstat通常需要额外处理来提取PID
        else
            echo "未找到占用端口$APP_PORT的进程"
        fi
    else
        echo "警告: 未找到lsof或netstat命令，无法检查端口占用情况"
    fi
fi

# 验证所有Node.js进程是否已停止
echo "\n验证所有Node.js进程是否已停止:"
NODE_PIDS_AFTER=$(pgrep node)
if [ -z "$NODE_PIDS_AFTER" ]; then
    echo "✓ 所有Node.js进程已成功停止"
else
    echo "✗ 仍有Node.js进程在运行: $NODE_PIDS_AFTER"
    echo "建议: 您可能需要使用管理员权限(sudo)再次运行此脚本"
fi

# 打印结束时间戳
echo "\n[$(date '+%Y-%m-%d %H:%M:%S')] 强制停止脚本执行完毕"