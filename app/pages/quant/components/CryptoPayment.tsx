'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Image from 'next/image'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

// USDT 和 USDC 在 Platon 网络上的合约地址
const TOKEN_CONTRACTS = {
  USDT: '0xeac734fb7581D8eB2CE4949B0896FC4E76769509',
  USDC: '0xdA396A3C7FC762643f658B47228CD51De6cE936d'
}

// 更新 TOKEN_ABI 以包含更多必要的函数
const TOKEN_ABI = [
  // 基本 ERC20 函数
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  // 事件
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

const RECIPIENT_ADDRESS = '0x37F02c567869F5729594Aa6261C9c3459D077e04'

interface CryptoPaymentProps {
  planName: string
  amount: number
  onBack: () => void
  onSuccess: () => void
}

export function CryptoPayment({ planName, amount, onBack, onSuccess }: CryptoPaymentProps) {
  const [selectedToken, setSelectedToken] = useState<'USDT' | 'USDC'>('USDT')
  const [isProcessing, setIsProcessing] = useState(false)
  const [balance, setBalance] = useState<string>('0')

  // 检查代币余额的函数
  const checkBalance = async () => {
    if (!window.ethereum) {
      toast.error('请安装 MetaMask')
      return
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      
      // 请求连接钱包
      await provider.send("eth_requestAccounts", [])
      
      // 确保连接到 PlatON 网络
      const network = await provider.getNetwork()
      if (network.chainId !== 210425) {
        toast.error('请切换到 PlatON 网络')
        return
      }

      const signer = provider.getSigner()
      const address = await signer.getAddress()

      // 验证合约地址
      const contractAddress = TOKEN_CONTRACTS[selectedToken]
      const code = await provider.getCode(contractAddress)
      
      if (code === '0x') {
        console.error('Invalid contract address')
        toast.error('无效的代币合约地址')
        return
      }

      // 创建合约实例
      const tokenContract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        provider
      )

      try {
        // 先检查合约是否有效
        const symbol = await tokenContract.symbol()
        console.log('Token Symbol:', symbol)

        // 获取代币精度
        const decimals = await tokenContract.decimals()
        console.log('Token Decimals:', decimals)

        // 获取余额
        const balance = await tokenContract.balanceOf(address)
        console.log('Raw Balance:', balance.toString())

        const formattedBalance = ethers.utils.formatUnits(balance, decimals)
        console.log('Formatted Balance:', formattedBalance)

        setBalance(formattedBalance)
      } catch (error) {
        console.error('Contract call error:', error)
        setBalance('0')
        toast.error('无法获取代币余额，请确认合约地址正确')
      }
    } catch (error) {
      console.error('Balance check error:', error)
      setBalance('0')
      toast.error('无法连接钱包或网络错误')
    }
  }

  // 在组件中使用
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (mounted) {
        await checkBalance()
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [selectedToken])

  const handlePayment = async () => {
    try {
      setIsProcessing(true)

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = provider.getSigner()

      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACTS[selectedToken],
        TOKEN_ABI,
        signer
      )

      const decimals = await tokenContract.decimals()
      const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals)

      // 检查余额是否足够
      const userBalance = await tokenContract.balanceOf(await signer.getAddress())
      if (userBalance.lt(tokenAmount)) {
        toast.error(`${selectedToken} 余额不足`)
        return
      }

      // 发送交易
      const tx = await tokenContract.transfer(RECIPIENT_ADDRESS, tokenAmount)
      toast.loading('交易处理中...')
      
      // 等待交易确认
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        toast.success('支付成功！')
        onSuccess()
      } else {
        toast.error('支付失败，请重试')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      if (error.code === 'ACTION_REJECTED') {
        toast.error('用户取消了交易')
      } else if (error.data?.message?.includes('transfer amount exceeds balance')) {
        toast.error(`${selectedToken} 余额不足`)
      } else {
        toast.error('支付失败，请重试')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-l from-purple-50 to-[#FFFEFF] py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-white border-gray-100 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">使用加密货币支付</h2>
            <div className="flex justify-between items-center mb-6">
              <div className="text-gray-600">支付：{planName}(以美元计费)</div>
              <div className="text-xl font-bold text-[#E4427D]">付款：${amount}</div>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              当前余额: {parseFloat(balance).toFixed(2)} {selectedToken}
            </div>

            <div className="mb-6">
              <div className="text-gray-600 mb-2">选择您想要用来支付的稳定币</div>
              <div className="text-sm text-gray-500 mb-4">目前只接受 Platon 网络</div>

              <RadioGroup 
                value={selectedToken} 
                onValueChange={(value) => setSelectedToken(value as 'USDT' | 'USDC')}
                className="space-y-3"
              >
                {/* USDT Option */}
                <div>
                  <RadioGroupItem
                    value="USDT"
                    id="usdt"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="usdt"
                    className="flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer
                      peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50
                      hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Image 
                        src="/usdt.png" 
                        alt="USDT" 
                        width={24} 
                        height={24}
                      />
                      <span className="font-medium">USDT (Network：Platon)</span>
                    </div>
                  </Label>
                </div>

                {/* USDC Option */}
                <div>
                  <RadioGroupItem
                    value="USDC"
                    id="usdc"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="usdc"
                    className="flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer
                      peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50
                      hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Image 
                        src="/usdc.png" 
                        alt="USDC" 
                        width={24} 
                        height={24}
                      />
                      <span className="font-medium">USDC (Network：Platon)</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={onBack}
                variant="outline" 
                className="flex-1 h-12 text-lg"
                disabled={isProcessing}
              >
                返回
              </Button>
              <Button 
                onClick={handlePayment}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg"
                disabled={isProcessing || parseFloat(balance) < amount}
              >
                {isProcessing ? '处理中...' : 
                 parseFloat(balance) < amount ? `${selectedToken} 余额不足` : '提交'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 