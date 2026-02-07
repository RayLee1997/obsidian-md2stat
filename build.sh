#!/bin/bash

# 获取版本号
version=$(grep '"version"' manifest.json | cut -d '"' -f 4)
zip_name="obsidian-md2stat-${version}.zip"

# 创建 releases 目录（如果不存在）
mkdir -p releases

# 检查目标文件是否存在
if [ -f "releases/${zip_name}" ]; then
    read -p "文件 ${zip_name} 已存在，是否覆盖？(y/n) " answer
    if [ "$answer" != "y" ]; then
        echo "打包已取消"
        exit 1
    fi
fi

# 创建临时目录
mkdir -p ../temp/obsidian-md2stat

# 复制必要文件
cp main.js manifest.json styles.css ../temp/obsidian-md2stat/
cp -r assets ../temp/obsidian-md2stat/ 2>/dev/null || true

# 切换到临时目录的上级目录
cd ../temp

# 创建 zip 文件
zip -r "${zip_name}" obsidian-md2stat

# 移动 zip 文件到项目的 releases 目录
mv "${zip_name}" ../obsidian-md2stat/releases/

# 清理临时目录
cd ..
rm -rf temp

echo "✅ 打包完成：releases/${zip_name}"