"use client"; 

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/app/event/context/WalletContext"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

const fetchUserData = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`
    );

    // 检查响应是否为 200 OK
    if (!response.ok) {
      console.error(`请求失败，状态码：${response.status}`);
      return null;
    }

    const data = await response.json();

    // 输出原始返回的数据，帮助调试
    console.log("API 返回数据:", data);

    // 如果请求成功并且返回的数据中包含 data 字段，则返回该数据
    if (data.success && data.data) {
      return data.data; // 返回用户数据
    } else {
      console.error("API 返回的数据结构不符合预期:", data);
      return null;
    }
  } catch (error) {
    // 捕获请求异常并输出错误信息
    console.error("请求 API 失败:", error);
    return null;
  }
};

// 添加新用户
const addUserToDatabase = async (walletAddress: string) => {
  const response = await fetch("https://api.deworkhub.com/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: walletAddress,
      points: 0,
      completed_steps: 0,
      freeAttemptsToday: 1,
      lastResetDate: null,
      RemainingTimes: 0,
    }),
  });
  const data = await response.json();
  return data;
};

export default function HomePage() {
  const { setWalletAddress } = useWallet();
  const [walletAddress, setWalletAddressLocal] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // 请求连接钱包
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const userAddress = accounts[0];
        setWalletAddressLocal(userAddress);
        setWalletAddress(userAddress);

        // 查询数据库，获取用户数据
        const user = await fetchUserData(userAddress);

        if (user) {
          // 如果用户存在，获取积分
          setScore(user.points); // 更新为从返回数据中的 `points` 字段
        } else {
          // 如果用户不存在，添加新用户并初始化积分
          await addUserToDatabase(userAddress);
          setScore(0); // 新用户的初始积分为 0
        }
      } catch (error) {
        console.error("连接 MetaMask 失败:", error);
      }
    } else {
      alert("请安装 MetaMask!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 justify-center items-center">
        <section className="space-y-8 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-6 text-center">
            <motion.h1
              className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              探索生态世界的
              <span className="text-gradient_indigo-purple"> 趣味之旅</span>
            </motion.h1>

            <motion.p
              className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              通过跳格子游戏，探索区块链生态的精彩世界。每一步都可能带来惊喜，
              每一跳都是新的发现。
            </motion.p>

            <motion.div
              className="space-x-4 flex justify-center mb-36"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                onClick={connectMetaMask}
              >
                连接钱包
              </Button>

              {/* 控制按钮的启用和链接 */}
              <Link href={walletAddress ? `/game` : "#"}>
                <Button
                  size="lg"
                  className={`bg-gradient-to-r from-indigo-500 to-purple-500 text-white ${
                    !walletAddress ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  disabled={!walletAddress} // 禁用按钮
                >
                  开始游戏
                </Button>
              </Link>
            </motion.div>

            {/* 钱包地址和积分显示 */}
            {walletAddress && (
              <div>
                <p>钱包地址: {walletAddress}</p>
                <p>当前积分: {score}</p>
              </div>
            )}

            {/* 如果钱包未连接，提示用户连接钱包 */}
            {!walletAddress && (
              <div className="text-red-500 mt-4">
                <p>请先连接钱包才能开始游戏！</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
