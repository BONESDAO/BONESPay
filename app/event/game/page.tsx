"use client";

import { useState, useEffect } from "react";
import JumpingGame from "@/components/JumpGame";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { useWallet } from "../context/WalletContext";

const fetchUserScore = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`
    );
    const data = await response.json();
    if (data.success && data.data) {
      return data.data.points; // 返回积分
    }
    return 0;
  } catch (error) {
    console.error("获取用户积分失败:", error);
    return 0;
  }
};

// 获取用户免费次数
const fetchUserFreeAttempts = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`
    );
    const data = await response.json();
    if (data.success && data.data) {
      const { freeAttemptsToday } = data.data;
      return freeAttemptsToday; // 返回免费次数
    }
    return 0;
  } catch (error) {
    console.error("获取用户免费次数失败:", error);
    return 0;
  }
};

// 更新用户最新登录时间的函数
const updateUserLastLoginTime = async (walletAddress: string) => {
  try {
    // 获取当前日期，格式为 YYYY-MM-DD
    const currentDate = new Date().toISOString().split("T")[0]; // 获取当前日期部分

    // 确保传递的参数没有 undefined
    const body = {
      address: walletAddress,
      lastResetDate: currentDate || null, // 如果 currentDate 没有值，则传递 null
    };

    // 打印请求体进行调试
    console.log("Request Body:", body);

    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          lastResetDate: currentDate, // 仅传递日期部分
        }),
      }
    );

    const data = await response.json();
    console.log("Response Data:", data); // 打印返回的 JSON 数据

    if (response.ok) {
      if (data.success) {
        console.log("用户登录时间更新成功:", data);
      } else {
        throw new Error("更新登录时间失败");
      }
    } else {
      throw new Error("更新登录时间失败!");
    }
  } catch (error) {
    console.error("更新登录时间失败:", error);
  }
};

export default function GamePage() {
  const { walletAddress } = useWallet();
  const [score, setScore] = useState(0);
  const [freeAttemptsToday, setFreeAttemptsToday] = useState(0);
  const [remainingTimes, setRemainingTimes] = useState(0);

  useEffect(() => {
    if (walletAddress) {
      const getScore = async () => {
        const userScore = await fetchUserScore(walletAddress);
        setScore(userScore);
      };
      const getFreeAttempts = async () => {
        const freeAttempts = await fetchUserFreeAttempts(walletAddress);
        setFreeAttemptsToday(freeAttempts);
      };

      const getRemainingTimes = async () => {
        const response = await fetch(
          `https://api.deworkhub.com/api/users/${walletAddress}`
        );
        const data = await response.json();
        if (data.success && data.data) {
          setRemainingTimes(data.data.RemainingTimes + freeAttemptsToday); // 更新剩余次数
        }
      };

      const updateLoginTime = async () => {
        await updateUserLastLoginTime(walletAddress); // 更新登录时间
      };
      getScore();
      getFreeAttempts();
      getRemainingTimes();
      updateLoginTime();
    }
  }, [walletAddress, freeAttemptsToday]);

  return (
    <div className="relative flex items-center justify-center min-h-[93vh] bg-gray-100 px-4 bg-[url('/backgroud.png')] bg-cover bg-center bg-no-repeat">
      <main className="flex-1 container py-6">
        <motion.div
          className="grid gap-6 lg:grid-cols-[1fr_300px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-1 ml-8">
              <h1 className="text-3xl font-bold tracking-tight">跳格子游戏</h1>
              <p className="text-muted-foreground">探索生态世界，收集奖励</p>
            </div>
            <JumpingGame
              score={score}
              freeAttemptsToday={freeAttemptsToday}
              onScoreChange={setScore}
              onFreeAttemptsChange={setFreeAttemptsToday}
              onRemainingTimesChange={setRemainingTimes}
            />
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>游戏状态</CardTitle>
                <CardDescription>当前游戏进度和得分</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前积分</span>
                    <span className="font-bold">{score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">剩余次数</span>
                    <span className="font-bold">{remainingTimes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      今天还有{" "}
                      <span className="font-bold text-green-500">
                        {freeAttemptsToday}
                      </span>{" "}
                      次免费次数
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>游戏说明</CardTitle>
                <CardDescription>了解游戏规则</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
                  <li>点击“摇骰子”按钮来移动</li>
                  <li>彩色格子为惊喜格子，可能获得特殊奖励</li>
                  <li>白色格子为普通格子</li>
                  <li>按照蛇形路径前进到第100个格子即可获胜！</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
