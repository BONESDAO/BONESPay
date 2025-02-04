"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RewardDialog } from "./reward-dialog";
import {
  type Cell,
  SURPRISE_CELLS,
  REWARDS,
  type RewardType,
  BOARD_LAYOUT,
} from "@/app/types/game";
import { Card } from "./ui/card";
import Image from "next/image";
import { useWallet } from "@/app/event/context/WalletContext";
import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import { toast } from "@/hook/use-toast";

const TOTAL_CELLS = 100;
// const MOVE_DELAY = 300;

function generateBoard(): Cell[] {
  const board: Cell[] = [];

  BOARD_LAYOUT.forEach((row, y) => {
    row.forEach((number, x) => {
      if (number === 0) {
        board.push({ number: 0, type: "normal", x, y, isEmpty: true });
      } else {
        const cell: Cell = {
          number,
          type: SURPRISE_CELLS.includes(number) ? "surprise" : "normal",
          x,
          y,
          isEmpty: false,
        };

        if (cell.type === "surprise") {
          for (const [reward, { cells }] of Object.entries(REWARDS)) {
            if (cells.includes(number)) {
              cell.reward = reward as RewardType;
              break;
            }
          }
        }
        board.push(cell);
      }
    });
  });

  return board;
}

// 获取用户剩余次数的函数
const getRemainingTimes = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.RemainingTimes;
    } else {
      throw new Error("获取剩余次数失败");
    }
  } catch (error) {
    console.error("获取剩余次数失败:", error);
    return 0;
  }
};

// 更新用户积分的函数
const updateUserScore = async (walletAddress: string, newScore: number) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          points: newScore, // 更新后的积分
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("积分更新成功:", data);
    } else {
      throw new Error("更新积分失败");
    }
  } catch (error) {
    console.error("更新积分失败:", error);
  }
};

// 更新用户免费次数的函数
const updateFreeAttemptsToday = async (
  walletAddress: string,
  newFreeAttemptsToday: number
) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          freeAttemptsToday: newFreeAttemptsToday,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("更新免费次数失败");
    }
  } catch (error) {
    console.error("Error updating free attempts:", error);
  }
};

// 更新用户剩余次数的函数
const updateRemainingTimes = async (
  walletAddress: string,
  newRemainingTimes: number
) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          RemainingTimes: newRemainingTimes,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("更新剩余次数失败");
    }
  } catch (error) {
    console.error("Error updating remaining times:", error);
  }
};

// 支付LAT的函数
const payTokens = async (walletAddress: string, amount: number) => {
  try {
    if (typeof window.ethereum !== "undefined") {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 进行代币支付（10 LAT）
      const transaction = await signer.sendTransaction({
        to: "0x7d8AF9e20E70cb3b3831e69Cba39D4c12B130efC", // 用户的 PlatON 钱包地址
        value: ethers.parseUnits(String(amount), 18), // 转账金额，单位为 LAT
      });

      await transaction.wait(); // 等待交易确认

      // 代币支付成功后，调用API
      const response = await fetch("https://api.deworkhub.com/api/task-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          task_id: 1,
          status: "已完成",
          reward_type: "代币",
          reward_value: amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("代币支付成功:", data);
        return true;
      } else {
        // API 请求失败
        const errorData = await response.json();
        console.error("代币支付失败:", errorData);
        return false;
      }
    } else {
      throw new Error("未检测到 Ethereum 钱包");
    }
  } catch (error) {
    console.error("代币支付过程中发生错误:", error);
    return false;
  }
};

// 获取当前位置
const getCurrentPosition = async (walletAddress: string) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`
    );
    const data = await response.json();
    if (data.success && data.data) {
      console.log("获取当前位置成功:", data.data.completed_steps);
      return data.data.completed_steps;
    } else {
      throw new Error("获取剩余次数失败");
    }
  } catch (error) {
    console.error("获取剩余次数失败:", error);
    return 0;
  }
};

// 更新当前位置
const updateCurrentPosition = async (
  walletAddress: string,
  currentPosition: number
) => {
  try {
    const response = await fetch(
      `https://api.deworkhub.com/api/users/${walletAddress}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: walletAddress,
          completed_steps: currentPosition,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("更新位置失败");
    }
  } catch (error) {
    console.error("更新当前位置失败:", error);
  }
};

export default function JumpingGame({
  score,
  freeAttemptsToday,
  onScoreChange,
  onFreeAttemptsChange,
  onRemainingTimesChange,
}: {
  score: number;
  freeAttemptsToday: number;
  onScoreChange: (newScore: number) => void;
  onFreeAttemptsChange: (newFreeAttempts: number) => void;
  onRemainingTimesChange: (newRemainingTimes: number) => void;
}) {
  const [playerPosition, setPlayerPosition] = useState<number>(1);
  const [diceValue, setDiceValue] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCell, setCurrentCell] = useState<Cell | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [rollingDice, setRollingDice] = useState<boolean>(false); // 控制动图显示
  const [diceImage, setDiceImage] = useState<string>(""); // 用于存储骰子图像路径
  const [remainingTimes, setRemainingTimes] = useState<number>(0); // 用户剩余次数
  const { walletAddress } = useWallet();
  const [gameCompleted, setGameCompleted] = useState(false); // 游戏是否完成

  const board = generateBoard();

  useEffect(() => {
    if (walletAddress) {
      // 获取用户剩余次数
      const fetchRemainingTimes = async () => {
        const times = await getRemainingTimes(walletAddress);
        setRemainingTimes(times);
      };
      const fetchCurrentPosition = async () => {
        const position = await getCurrentPosition(walletAddress);
        setPlayerPosition(position);
        if (position === TOTAL_CELLS) {
          setGameCompleted(true);
        }
        console.log("current position", position);
      };
      fetchRemainingTimes();
      fetchCurrentPosition();
    }
  }, [walletAddress]);

  const rollDice = useCallback(async () => {
    if (gameCompleted) return;

    const updateScore = async (walletAddress: string, score: number) => {
      const newScore = score;

      await updateUserScore(walletAddress, newScore);
      onScoreChange(newScore);
    };

    if (!walletAddress) {
      toast({
        title: "钱包地址无效，请连接钱包！",
      });
      return; // 如果没有钱包地址，终止函数
    }

    // 获取用户的剩余次数
    const getRemainingTimes = async () => {
      const response = await fetch(
        `https://api.deworkhub.com/api/users/${walletAddress}`
      );
      const data = await response.json();
      if (data.success && data.data) {
        return data.data.RemainingTimes;
      } else {
        console.error("无法获取剩余次数");
      }
    };

    const times = await getRemainingTimes();
    setRemainingTimes(times);

    // 如果没有免费次数和剩余次数，则需要支付代币购买
    if (freeAttemptsToday === 0 && remainingTimes <= 0) {
      const paymentSuccess = await payTokens(walletAddress, 10); // 支付10代币
      if (!paymentSuccess) {
        toast({
          title: "代币支付失败，无法继续摇骰子！",
        });
        return; // 支付失败则终止函数执行
      }
    } else if (freeAttemptsToday > 0) {
      // 如果有免费次数，则减少免费次数
      const updatedFreeAttemptsToday = freeAttemptsToday - 1;
      await updateFreeAttemptsToday(walletAddress, updatedFreeAttemptsToday); // 更新服务器上的免费次数
      onFreeAttemptsChange(updatedFreeAttemptsToday);
    } else if (remainingTimes > 0) {
      // 如果有剩余次数，则使用剩余次数
      const updatedRemainingTimes = remainingTimes - 1; // 使用 1 次
      await updateRemainingTimes(walletAddress, updatedRemainingTimes); // 更新服务器上的剩余次数

      // 更新本地状态
      setRemainingTimes(updatedRemainingTimes);
      onRemainingTimesChange(updatedRemainingTimes);
    } else {
      // 没有剩余次数和免费次数
      toast({
        title: "您今天的免费次数已用完，之后将使用普通次数。",
        description: "提示：请再次点击摇骰子继续游戏",
      });
      return; // 终止函数执行
    }

    setRollingDice(true); // 显示摇骰子动图
    setLoading(true);
    setDiceValue(0); // 清除之前的骰子值，防止之前显示的结果残留

    // 显示骰子动图并延迟展示实际骰子
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒延迟
    const newDiceValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(newDiceValue);
    setRollingDice(false);
    // movePlayer(newDiceValue);

    const diceImages = [
      "/1.png",
      "/2.png",
      "/3.png",
      "/4.png",
      "/5.png",
      "/6.png",
    ];
    setDiceImage(diceImages[newDiceValue - 1]);

    // 延迟显示实际骰子图并更新玩家位置
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒延迟
    const newPosition = Math.min(playerPosition + newDiceValue, TOTAL_CELLS);
    setPlayerPosition(newPosition);
    await updateCurrentPosition(walletAddress, newPosition);

    let cell = board.find(
      (cell) => cell.number === newDiceValue && !cell.isEmpty
    )!;

    if (cell.type === "surprise") {
      // 如果当前玩家位置为“惊喜”类型，则更新积分为惊喜积分+(普通积分-1)
      const newScore = cell.number + (newDiceValue - 1);
      cell = board.find(
        (cell) => cell.number === newScore && !cell.isEmpty
      )!;
      updateScore(walletAddress, score + newScore);
    } else {
      if (cell.type === "normal") {
        cell = board.find(
          (cell) => cell.number === newDiceValue && !cell.isEmpty
        )!;
        updateScore(walletAddress, score + newDiceValue);
      }
    }
    setCurrentCell(cell);
    setDialogOpen(true);

    setLoading(false);
  }, [
    playerPosition,
    score,
    walletAddress,
    board,
    freeAttemptsToday,
    remainingTimes,
    onScoreChange,
    onFreeAttemptsChange,
    onRemainingTimesChange,
    gameCompleted,
  ]);

  // 移动
  // const movePlayer = useCallback(
  //   (steps: number) => {
  //     setIsMoving(true)
  //     let currentStep = 0
  //     let accumulatedScore = 0

  //     const moveInterval = setInterval(() => {
  //       if (currentStep < steps) {
  //         setPlayerPosition((prev) => {
  //           const newPosition = Math.min(prev + 1, TOTAL_CELLS)
  //           const cell = board.find((c) => c.number === newPosition && !c.isEmpty)
  //           if (cell) {
  //             accumulatedScore += cell.type === "surprise" ? cell.number : 1
  //           }
  //           if (newPosition === TOTAL_CELLS) {
  //             clearInterval(moveInterval)
  //             setGameCompleted(true)
  //           }
  //           return newPosition
  //         })
  //         currentStep++
  //       } else {
  //         clearInterval(moveInterval)
  //         setIsMoving(false)
  //         const newPosition = Math.min(playerPosition + steps, TOTAL_CELLS)
  //         const cell = board.find((c) => c.number === newPosition && !c.isEmpty)
  //         if (cell) {
  //           setCurrentCell(cell)
  //           setDialogOpen(true)
  //           setScore((prevScore) => {
  //             const newScore = prevScore + accumulatedScore
  //             return newScore
  //           })
  //           // Move the onScoreUpdate call outside of setScore
  //           onScoreUpdate(score + accumulatedScore)
  //         }
  //       }
  //     }, MOVE_DELAY)
  //   },
  //   [playerPosition, board, onScoreUpdate, score],
  // )

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="bg-transparent border-0 shadow-none">
        <div className="relative w-full max-w-6xl p-4 rounded-lg overflow-hidden">
          <div className="grid grid-cols-24 gap-1 gap-x-2 space-x-2 bg-transparent">
            {board.map((cell, index) => (
              <div
                key={index}
                className={`aspect-square bg-transparent ${
                  cell.isEmpty ? "invisible" : "relative"
                }`}
              >
                {!cell.isEmpty && (
                  <div
                    className={`h-10 w-16 shadow-none opacity-100 ${
                      cell.number === playerPosition
                        ? "text-blue-500"
                        : cell.type === "surprise"
                        ? "bg-[url('/surprise-image.png')] bg-cover bg-center bg-[length:140%]"
                        : "bg-[url('/common-image.png')] bg-cover bg-center bg-[length:140%]"
                    }`}
                  >
                    {cell.number === playerPosition ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative inset-0 flex items-center justify-center"
                      >
                        <UserAvatar address={walletAddress!} size={32} />
                        {/* <Image
                          src="/avater.png"
                          width={48}
                          height={48}
                          alt="avater"
                          className="absolute z-0 bg-cover"
                        /> */}
                      </motion.div>
                    ) : (
                      ""
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${((playerPosition - 1) / (TOTAL_CELLS - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-center space-x-4 mt-4">
        <Button
          onClick={rollDice}
          disabled={playerPosition === TOTAL_CELLS || loading || gameCompleted}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
          size="lg"
        >
          摇骰子
          {diceValue > 0 && <span className="ml-2">骰子点数：{diceValue}</span>}
        </Button>
      </div>

      {/* 显示摇骰子动图 */}
      {rollingDice && (
        <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-black z-10">
          <Image src="/dice.gif" alt="Rolling Dice" width={100} height={100} />
        </div>
      )}

      {/* 显示实际骰子图片 */}
      {!rollingDice && diceImage && (
        <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-black z-10">
          <Image src={diceImage} alt="Dice" width={100} height={100} />
        </div>
      )}

      {gameCompleted && (
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold mb-2">恭喜您通关游戏！</h2>
          <p className="mb-4">您已经到达终点，请前往奖励中心兑换您的奖励。</p>
          <Link href="/rewards" passHref>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              进入奖励中心
            </Button>
          </Link>
        </div>
      )}

      {currentCell && (
        <RewardDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setDiceImage(""); // 在关闭弹窗时清除骰子图像
          }}
          cellNumber={currentCell.number}
          cellType={currentCell.type}
          reward={currentCell.reward}
        />
      )}

      <div className="mt-4">
        <p>当前积分: {score}</p>
      </div>
    </div>
  );
}
