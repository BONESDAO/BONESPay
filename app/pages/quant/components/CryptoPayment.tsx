'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Image from 'next/image'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import Web3 from 'web3'
import { toBech32Address, fromBech32Address } from '@/app/utils/platonUtils'

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

// 接收地址 - 支持 Bech32 和 EIP55 格式
const RECIPIENT_ADDRESS = 'lat1strfcjux3msml239f2p8nl33qhqalza0r08t56'

// 使用 PlatON SDK 进行地址转换
const convertLatToHexAddress = (address: string): string => {
  try {
    if (address.startsWith('lat')) {
      // 使用 PlatON SDK 的 fromBech32Address 方法转换地址
      const hexAddress = fromBech32Address(address)
      console.log('Converting LAT address:', address, 'to hex:', hexAddress)
      return hexAddress
    }
    return address
  } catch (error) {
    console.error('Address conversion error:', error)
    throw new Error('Invalid address format')
  }
}

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

  // 检查代币余额
  const checkBalance = async () => {
    if (!window.ethereum) {
      toast.error('请安装 MetaMask')
      return
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      // 确保连接到 PlatON 网络
      const network = await provider.getNetwork()
      if (network.chainId !== 210425) {
        toast.error('请切换到 PlatON 网络')
        return
      }

      const signer = provider.getSigner()
      const address = await signer.getAddress()

      // 获取代币余额
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACTS[selectedToken],
        TOKEN_ABI,
        signer
      )

      const decimals = await tokenContract.decimals()
      const balance = await tokenContract.balanceOf(address)
      const formattedBalance = ethers.utils.formatUnits(balance, decimals)
      setBalance(formattedBalance)
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

  // 处理支付
  const handlePayment = async () => {
    try {
      setIsProcessing(true)

      if (!window.ethereum) {
        toast.error('请安装 MetaMask')
        return
      }

      // 初始化 Web3
      const web3 = new Web3(window.ethereum)
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // 检查网络
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (parseInt(chainId, 16) !== 210425) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x335f9' }]
          })
        } catch (switchError: any) {
          // ... 网络切换代码保持不变 ...
        }
      }

      // 获取当前账户
      const accounts = await web3.eth.getAccounts()
      const fromAddress = accounts[0]

      // 转换地址
      const hexAddress = convertLatToHexAddress(RECIPIENT_ADDRESS)
      console.log('Using hex address for transfer:', hexAddress)

      if (selectedToken === 'LAT') {
        try {
          // 构建交易对象
          const tx = await web3.eth.sendTransaction({
            from: fromAddress,
            to: hexAddress,
            value: web3.utils.toWei(amount.toString(), 'ether'),
            gas: '21000'
          })

          toast.loading('交易处理中...')
          
          if (tx.status) {
            toast.success('支付成功！')
            onSuccess()
          } else {
            toast.error('支付失败，请重试')
          }
        } catch (error: any) {
          console.error('Transaction error:', error)
          if (error.code === 4001) {
            toast.error('用户取消了交易')
          } else if (error.message === 'Invalid address format') {
            toast.error('无效的地址格式')
          } else {
            toast.error('交易失败，请重试')
          }
        }
        return
      }

      // ERC20 代币转账
      try {
        const tokenContract = new web3.eth.Contract(
          TOKEN_ABI as any[],
          TOKEN_CONTRACTS[selectedToken]
        )

        const decimals = await tokenContract.methods.decimals().call()
        const tokenAmount = web3.utils.toWei(amount.toString(), 'ether')

        // 检查余额是否足够
        const userBalance = await tokenContract.methods.balanceOf(fromAddress).call()
        if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(tokenAmount))) {
          toast.error(`${selectedToken} 余额不足`)
          return
        }

        // 发送代币转账交易
        const tx = await tokenContract.methods.transfer(hexAddress, tokenAmount).send({
          from: fromAddress,
          gas: '100000'
        })

        toast.loading('交易处理中...')
        
        if (tx.status) {
          toast.success('支付成功！')
          onSuccess()
        } else {
          toast.error('支付失败，请重试')
        }
      } catch (error: any) {
        console.error('Transaction error:', error)
        if (error.code === 4001) {
          toast.error('用户取消了交易')
        } else {
          toast.error('交易失败，请重试')
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      if (error.code === 4001) {
        toast.error('用户取消了交易')
      } else if (error.message?.includes('insufficient funds')) {
        toast.error(`${selectedToken} 余额不足`)
      } else {
        toast.error('交易失败，请重试')
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