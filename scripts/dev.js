// 把 package 目录下所有得包进行打包

const fs = require("fs");
const execa = require("execa");

const target = "runtime-dom";
// 对目标进行一次打包，并行打包
build(target);
async function build(target) {
  await execa("rollup", ["-c",'-w', "--environment", `TARGET:${target}`], {
    stdio: "inherit",
  });
}
