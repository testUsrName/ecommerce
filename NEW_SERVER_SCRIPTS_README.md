# 阿里云服务器管理脚本说明

本文档简要介绍为阿里云Linux服务器创建的三个新文件的用途和使用方法。

## 1. force-stop-server-linux.sh

**功能:** 强制停止所有Node.js相关进程，特别是app.js服务

**适用场景:**
- 当常规stop脚本无法找到或停止进程时
- 需要确保所有Node.js进程都被终止的情况

**使用方法:**
```bash
# 直接运行
chmod +x force-stop-server-linux.sh
./force-stop-server-linux.sh

# 或者通过npm命令运行
npm run linux:force-stop
```

**特点:**
- 包含三种不同的进程查找和终止方法
- 检查特定app.js进程、所有Node进程和端口占用情况
- 提供详细的执行状态反馈

## 2. reliable-restart-server-linux.sh

**功能:** 可靠地重启Node.js服务，包含完整的停止和启动流程

**适用场景:**
- 需要确保服务能够可靠重启的情况
- 常规重启脚本失败时的备用方案
- 生产环境中需要稳定重启服务的场景

**使用方法:**
```bash
# 直接运行
chmod +x reliable-restart-server-linux.sh
./reliable-restart-server-linux.sh

# 或者通过npm命令运行
npm run linux:reliable-restart
```

**特点:**
- 多级停止机制确保彻底终止现有服务
- 多种启动方式确保服务能够成功启动
- 自动创建日志目录并记录详细日志
- 记录服务PID以便后续管理
- 验证服务启动状态并提供反馈

## 3. ALIYUN_SERVER_MANAGEMENT_GUIDE.md

**功能:** 提供阿里云Linux服务器上管理Node.js服务的详细指南

**内容包括:**
- 快速参考命令
- 脚本详细说明
- 常见问题与解决方案
- 服务监控建议
- 紧急联系方式

**使用方法:**
```bash
# 查看指南
cat ALIYUN_SERVER_MANAGEMENT_GUIDE.md
# 或使用文本编辑器打开
vi ALIYUN_SERVER_MANAGEMENT_GUIDE.md
```

## 4. npm命令汇总

为了方便使用，已在package.json中添加了以下npm命令:

```bash
# Windows环境
npm run start       # 启动服务
npm run dev         # 开发模式启动
npm run stop        # 停止服务
npm run restart     # 重启服务

# Linux环境
npm run linux:stop       # 常规停止服务
npm run linux:restart    # 常规重启服务
npm run linux:force-stop     # 强制停止服务
npm run linux:reliable-restart # 可靠重启服务
```

## 注意事项

1. 在Linux服务器上首次运行shell脚本时，可能需要添加执行权限：`chmod +x *.sh`
2. 如果遇到权限问题，可以尝试使用sudo命令运行
3. 日志文件保存在logs目录下，可以用于排查问题
4. 建议定期查看日志文件，监控服务运行状态

创建时间: $(date '+%Y-%m-%d %H:%M:%S')