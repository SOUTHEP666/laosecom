# 使用官方 Node.js 运行时镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（可考虑生产环境只装 prod 依赖）
RUN npm install --production

# 复制所有项目文件
COPY . .

# 编译或构建指令（如果有）
# RUN npm run build

# 设定环境变量（可在 docker-compose 覆盖）
ENV NODE_ENV=production

# 启动命令
CMD ["node", "server.js"]

# 暴露端口（与 docker-compose 端口对应）
EXPOSE 3000
