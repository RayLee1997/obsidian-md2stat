#!/bin/bash

# 获取版本号
version=$(grep '"version"' manifest.json | cut -d '"' -f 4)
zip_name="obsidian-md2stat-${version}.zip"

# 检查目标文件是否存在
if [ -f "../../${zip_name}" ]; then  # 修改路径检查到上两层
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
cp -r assets ../temp/obsidian-md2stat/

# 切换到临时目录的上级目录
cd ../temp

# 创建 zip 文件
zip -r "${zip_name}" obsidian-md2stat

# 移动 zip 文件到上两层目录
mv "${zip_name}" ../../

echo "打包完成：${zip_name}"