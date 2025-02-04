"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserAvatar } from "@/components/UserAvatar"

type LeaderboardEntry = {
  rank: number
  username: string
  score: number
}

type User = {
  address: string
  points: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // 请求排行榜数据
    const fetchLeaderboardData = async () => {
      try {
        // 获取用户列表
        const usersResponse = await fetch(
          "https://api.deworkhub.com/api/users",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const usersData = await usersResponse.json();

        if (usersData.success && usersData.data) {
          // 获取用户地址和积分数据
          const users = usersData.data.map((user: User) => ({
            address: user.address,
            points: user.points,
          }));

          // 根据积分排序用户
          const sortedUsers = users.sort(
            (a: User, b: User) => b.points - a.points
          );

          // 格式化数据并更新 state
          const leaderboardData = sortedUsers.map(
            (user: User, index: number) => ({
              rank: index + 1, // 排名
              username: user.address, // 用户名即为地址
              score: user.points, // 积分
            })
          );

          setLeaderboard(leaderboardData);
        } else {
          console.error("获取用户数据失败", usersData);
        }
      } catch (error) {
        console.error("获取用户数据失败:", error);
      }
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">排行榜</h1>
      <Table>
        <TableCaption>实时用户积分排名</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>排名</TableHead>
            <TableHead>用户头像</TableHead>
            <TableHead>用户名</TableHead>
            <TableHead>积分</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((entry) => (
            <TableRow key={entry.rank}>
              <TableCell>{entry.rank}</TableCell>
              <TableCell>
                <UserAvatar address={entry.username} size={32}></UserAvatar>
              </TableCell>
              <TableCell>{entry.username}</TableCell>
              <TableCell>{entry.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
