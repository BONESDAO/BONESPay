'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, User, Users, LogOut, Copy, ExternalLink, Settings, ArrowLeft } from 'lucide-react'
import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { formatEther, parseEther, formatUnits, parseUnits } from '@ethersproject/units'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import CryptoJS from 'crypto-js'
import {TransactionRecords} from './transactionRecords'
import Contacts from './contacts'
import { ContactSelector } from './contact-selector'
import { useRouter } from 'next/navigation'
import { QRCodeModal } from './qr-code-modal'
import { TransferStatusDialog } from './transfer-status-dialog'
import toast, { Toaster } from 'react-hot-toast'
import { SettingsModal } from './settings-modal'
import { getUserName } from '@/app/actions/user-settings'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react'
import { fromBech32Address } from '@/app/utils/platonUtils'
import bech32 from 'bech32'



const PLATON_MAINNET_PARAMS = {
  chainId: '0x335f9', 
  chainName: 'PlatON Mainnet',
  nativeCurrency: {
    name: 'LAT',
    symbol: 'lat',
    decimals: 18,
  },
  rpcUrls: ['https://openapi2.platon.network/rpc'],
  blockExplorerUrls: ['https://scan.platon.network/'],
}

const TOKEN_ADDRESSES = {
  USDT: '0xeac734fb7581D8eB2CE4949B0896FC4E76769509',
  USDC: '0xdA396A3C7FC762643f658B47228CD51De6cE936d',
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint amount) returns (bool)',
]

const API_KEY = "ae1568e8-8ccf-446b-aeae-d922e8602a47"
const SECRET_KEY = "DE2EBE6141CAA5466BC89A2DCED96AF4"

const getExchangeRate = async () => {
  const timestamp = Date.now() / 1000
  const method = 'GET'
  const requestPath = '/api/v5/market/ticker?instId=LAT-USDT'
  const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(`${timestamp}${method}${requestPath}`, SECRET_KEY))

  const response = await fetch(`https://www.okx.com${requestPath}`, {
    method: method,
    headers: {
      'OK-ACCESS-KEY': API_KEY,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': timestamp.toString(),
      'OK-ACCESS-PASSPHRASE': '',
    },
  })

  const data = await response.json()
  if (data.data && data.data[0]) {
    return parseFloat(data.data[0].last)
  }
  throw new Error('Failed to fetch exchange rate')
}

const DAPPS_LINKS = [
  {
    name: 'BONES',
    icon: '/bones-2.png',
    href: 'https://t.me/Bones_Gamebot/bones' 
  },
  {
    name: 'NiftyIN',
    icon: '/NiftyIN.png', 
    href: 'https://www.niftyin.xyz' 
  },
  {
    name: 'DipoleSwap',
    icon: '/DipoleSwap.png',
    href: 'https://dipoleswap.exchange' 
  }
]

const WALLETS_LINKS = [
  {
    name: 'ATON',
    icon: '/ATON.png',
    href: 'https://www.platon.network/wallet' 
  },
  {
    name: 'TOP Wallet',
    icon: '/TOPWallet.png',
    href: 'https://www.paytop.io/' 
  }
]


export function BONESPayInterface() {
  const [account, setAccount] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [walletHovered, setWalletHovered] = useState(false)
  const [balances, setBalances] = useState({
    LAT: '0',
    USDT: '0',
    USDC: '0',
  })
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('LAT')
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [latRate, setLatRate] = useState(1)
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false)
  const [contacts, setContacts] = useState<{ id: number; name: string; address: string }[]>([])
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrModalTitle, setQrModalTitle] = useState('')
  const [transferStatus, setTransferStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [showTransferStatus, setShowTransferStatus] = useState(false)
  const [activeTab, setActiveTab] = useState('assets')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()
  const transferTabRef = useRef<HTMLButtonElement>(null)

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true)
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [PLATON_MAINNET_PARAMS],
        })
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])
        localStorage.setItem('connectedAccount', accounts[0])
        await fetchBalances(accounts[0])
        await fetchDisplayName(accounts[0])
      } catch (error) {
        console.error('连接MetaMask时出错:', error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      alert('请安装MetaMask!')
    }
  }

  const fetchBalances = useCallback(async (address: string) => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new Web3Provider(window.ethereum)
      const latBalance = await provider.getBalance(address)
      setBalances(prev => ({ ...prev, LAT: formatEther(latBalance) }))

      for (const [token, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        const balance = await contract.balanceOf(address)
        const decimals = await contract.decimals()
        setBalances(prev => ({ 
          ...prev, 
          [token]: formatUnits(balance, decimals) 
        }))
      }
    }
  }, [])

  const fetchDisplayName = async (address: string) => {
    try {
      const name = await getUserName(address)
      if (name) {
        setDisplayName(name)
      }
    } catch (error) {
      console.error('Error fetching display name:', error)
    }
  }

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('地址已复制到剪贴板', {
        duration: 2000,
        position: 'top-center',
        icon: '👍',
      })
    } catch (err) {
      console.error('复制文本失败: ', err)
      toast.error('无法复制地址到剪贴板', {
        duration: 2000,
        position: 'top-center',
        icon: '❌',
      })
    }
  }

  const handleLogout = () => {
    setAccount('')
    setIsOpen(false)
    setBalances({
      LAT: '0',
      USDT: '0',
      USDC: '0',
    })
    setDisplayName('')
    localStorage.removeItem('connectedAccount')
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const convertLatToHexAddress = (address: string): string => {
    try {
      if (!address) {
        console.error('Empty address provided to converter');
        throw new Error('地址不能为空');
      }
      
      console.log('Converting address:', address, 'Type:', typeof address);
      
      if (typeof address === 'string' && address.trim().startsWith('lat')) {
        try {
          const decoded = bech32.decode(address.trim());
          const hexBuffer = Buffer.from(bech32.fromWords(decoded.words));
          const hexAddress = "0x" + hexBuffer.toString('hex');
          console.log('Converted to hex address:', hexAddress);
          return hexAddress;
        } catch (conversionError) {
          console.error('PlatON address conversion failed:', conversionError);
          throw new Error('LAT地址格式无效');
        }
      }
      
      if (typeof address === 'string' && address.trim().startsWith('0x')) {
        if (address.trim().length !== 42) {
          console.error('Invalid hex address length:', address.trim().length);
          throw new Error('地址长度无效');
        }
        return address.trim();
      }
      
      console.error('Address format not recognized:', address);
      throw new Error('地址格式无效');
    } catch (error) {
      console.error('Address conversion error:', error);
      throw error;
    }
  }

  const handleERC20Transfer = async (tokenAddress, recipient, amount) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = provider.getSigner();
      const fromAddress = await signer.getAddress();
      
      // 使用正确的 ERC20 ABI
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          // 最小化的 ERC20 ABI
          "function decimals() view returns (uint8)",
          "function balanceOf(address owner) view returns (uint256)",
          "function transfer(address to, uint256 value) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 value) returns (bool)"
        ],
        signer
      );
      
      // 获取代币精度
      const decimals = await tokenContract.decimals();
      console.log("Token decimals:", decimals);
      
      // 格式化金额为 Wei (使用正确的精度)
      const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals);
      console.log("Token amount in Wei:", tokenAmount.toString());
      
      // 检查余额
      const balance = await tokenContract.balanceOf(fromAddress);
      if (balance.lt(tokenAmount)) {
        throw new Error("余额不足");
      }
      
      // 发送交易
      const tx = await tokenContract.transfer(recipient, tokenAmount);
      console.log("Transaction sent:", tx?.hash || "交易对象为空");
      
      // 添加适当的检查
      if (!tx) {
        throw new Error("交易创建失败");
      }
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      return {
        success: true,
        hash: tx.hash
      };
    } catch (error) {
      console.error("ERC20 transfer error:", error);
      throw error;
    }
  };

  const handleTransfer = async () => {
    if (!account || !recipient || !amount) return

    setTransferStatus('loading')
    setShowTransferStatus(true)
    setIsTransferring(true)
    setTransferError('')

    try {
      const provider = new Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const recipientHex = convertLatToHexAddress(recipient)
      console.log('Using address for transfer:', recipient, '->', recipientHex)

      let tx;
      if (selectedAsset === 'LAT') {
        const amountWei = parseEther(amount)
        tx = await signer.sendTransaction({
          to: recipientHex,
          value: amountWei
        })
      } else {
        const tokenAddress = TOKEN_ADDRESSES[selectedAsset as keyof typeof TOKEN_ADDRESSES]
        const result = await handleERC20Transfer(tokenAddress, recipientHex, amount)
        
        if (result.success) {
          toast.success('代币转账成功!')
          setTransferStatus('success')
          setAmount('')
          setRecipient('')
          await fetchBalances(account)
          router.refresh()
        }
      }

      if (tx && tx.hash) {
        try {
          const response = await fetch('/api/recordTransfer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount,
              asset: selectedAsset,
              sender: account,
              recipient: recipientHex,
              txHash: tx.hash,
              timestamp: new Date().toISOString(),
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to record transfer');
          }
        } catch (recordError) {
          console.error('Error recording transfer:', recordError);
        }
      }

      setTransferStatus('success')
      setAmount('')
      setRecipient('')
      await fetchBalances(account)
      router.refresh()
    } catch (error: any) {
      console.error('转账失败:', error)
      setTransferStatus('error')
      setTransferError(error.message || '转账失败，请检查您的余额和网络连接')
    } finally {
      setIsTransferring(false)
      setTimeout(() => {
        setShowTransferStatus(false)
      }, 3000) 
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/contacts?userId=${account}`)
      if (response.ok) {
        const fetchedContacts = await response.json()
        setContacts(fetchedContacts)
      } else {
        console.error('Failed to fetch contacts')
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const handleContactSelect = (address: string) => {
    setRecipient(address)
  }

  const handleQRCodeClick = (title: string) => {
    setQrModalTitle(title)
    setShowQRModal(true)
  }

  const handleTransferClick = useCallback(() => {
    setActiveTab('transferRecords')
    if (transferTabRef.current) {
      transferTabRef.current.click()
    }
    setTimeout(() => {
      const transferSection = document.getElementById('transfer-section')
      if (transferSection) {
        transferSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }, [])

  const handleHeaderQRCodeClick = () => {
    handleQRCodeClick('收款')
  }

  const handleHistoryClick = () => {
    setActiveTab('transactionRecords')
    setTimeout(() => {
      const transactionRecordsSection = document.getElementById('transaction-records-section')
      if (transactionRecordsSection) {
        transactionRecordsSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getExchangeRate()
        setLatRate(rate)
      } catch (error) {
        console.error('Failed to fetch LAT exchange rate:', error)
      }
    }

    fetchExchangeRate()
    const intervalId = setInterval(fetchExchangeRate, 60000) 

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const savedAccount = localStorage.getItem('connectedAccount')
    if (savedAccount) {
      setAccount(savedAccount)
      fetchBalances(savedAccount)
      fetchDisplayName(savedAccount)
    }

    const handleAccountsChanged = (accounts: string[]) => {
      const newAccount = accounts[0] || ''
      setAccount(newAccount)
      if (newAccount) {
        localStorage.setItem('connectedAccount', newAccount)
        fetchBalances(newAccount)
        fetchDisplayName(newAccount)
      } else {
        localStorage.removeItem('connectedAccount')
        setBalances({
          LAT: '0',
          USDT: '0',
          USDC: '0',
        })
        setDisplayName('')
      }
    }

    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
    }

    const intervalId = setInterval(() => {
      if (account) {
        fetchBalances(account)
      }
    }, 10000)

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
      clearInterval(intervalId)
    }
  }, [account, fetchBalances, latRate])

  useEffect(() => {
    if (account) {
      fetchContacts()
    }
  }, [account])

  // 添加延迟时间常量
  const HOVER_DELAY = 300;  // 300ms
  const CLOSE_DELAY = 1000; // 1000ms

  // 添加状态来跟踪鼠标是否在下拉菜单上
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-l from-purple-50 to-[#FFFEFF]">
      <Toaster />
      <header className="flex items-center justify-between p-4 bg-none">
        <div className="flex items-center space-x-4">
          <a href='/' className="flex items-center space-x-4">
            <Image src="/Dew.png" alt="BONESPay logo" width={32} height={32} className="w-8 h-8" />
            <h1 className="text-2xl font-bold">DeworkPay</h1>
          </a>
          <nav className="hidden md:flex space-x-4 border-l">
            {/* <a href="https://bones.icu/" className="text-sm font-medium ml-8">BONESDAO</a> */}
            <a href="https://register.deworkhub.com/" className="text-sm font-medium ml-8">Register</a>
            <a href="https://scan.platon.network/" className="text-sm font-medium">PlatScan</a>
            <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center text-sm font-medium">
          Dapps <ChevronDown className="ml-1 h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {DAPPS_LINKS.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link 
                href={item.href}
                className="flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image 
                  src={item.icon} 
                  alt={item.name} 
                  width={20} 
                  height={20} 
                  className="mr-2" 
                />
                {item.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center text-sm font-medium">
          Wallets <ChevronDown className="ml-1 h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {WALLETS_LINKS.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link 
                href={item.href}
                className="flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image 
                  src={item.icon} 
                  alt={item.name} 
                  width={20} 
                  height={20} 
                  className="mr-2" 
                />
                {item.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <a href="./pages/pools" className="text-sm font-medium">Pools</a>
      <a href="./event" className="text-sm font-medium">Event</a>
          </nav>
        </div>
        <div className="flex items-center space-x-1 mr-2">
          <Button variant="ghost" size="sm">
            <Image src="/languages.svg" alt="Language" width={20} height={20} className="mr-0" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleHeaderQRCodeClick}>
            <Image src="/receive-code.svg" alt="QR Code" width={20} height={20} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleHistoryClick}>
            <Image src="/history.svg" alt="Notification" width={20} height={20} />
          </Button>
          {account ? (
            <div 
              className="relative"
              onMouseEnter={() => {
                setIsOpen(true);
                // 清除任何现有的关闭定时器
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                }
              }}
              onMouseLeave={() => {
                // 设置延迟关闭
                closeTimeoutRef.current = setTimeout(() => {
                  if (!isMenuHovered) {
                    setIsOpen(false);
                  }
                }, CLOSE_DELAY);
              }}
            >
              <div className="px-4 py-1.5 bg-gradient-to-r from-purple-50 to-white rounded-full border border-purple-100 cursor-pointer hover:bg-purple-50">
                <span className="text-sm font-medium text-purple-900">
                  {displayName || truncateAddress(account)}
                </span>
              </div>
              {isOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-40"
                  onMouseEnter={() => {
                    setIsMenuHovered(true);
                    if (closeTimeoutRef.current) {
                      clearTimeout(closeTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    setIsMenuHovered(false);
                    closeTimeoutRef.current = setTimeout(() => {
                      setIsOpen(false);
                    }, HOVER_DELAY);
                  }}
                >
                  <div className="flex justify-center mt-2 mb-2">
                    <div className="p-4 space-y-3 bg-purple-100 rounded-md w-[90%]">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">地址</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{truncateAddress(account)}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(account)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(`https://scan.platon.network/address-detail?address=${account}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="relative px-2 py-1 hover:bg-purple-50 cursor-pointer"
                    onMouseEnter={() => setWalletHovered(true)}
                    onMouseLeave={() => {
                      setTimeout(() => setWalletHovered(false), 300)
                    }}
                  >
                    <div className="relative flex items-center gap-2 px-2 py-1">
                      <Wallet className="h-4 w-4" />
                      <span>钱包</span>
                      {walletHovered && (
                        <button 
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-50 text-black text-xs px-2 py-1 rounded shadow-sm hover:bg-purple-100 transition"
                          onClick={handleTransferClick}
                        >
                          转账
                        </button>
                      )}
                    </div>               
                  </div>
                  <div 
                    className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <User className="h-4 w-4" />
                      <span>账户信息</span>
                    </div>
                  </div>
                  <div 
                    className="px-2 py-1 hover:bg-purple-50 cursor-pointer"
                    onClick={() => {
                      setActiveTab('contacts');
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <Users className="h-4 w-4" />
                      <span>联系人</span>
                    </div>
                  </div>
                  <div 
                    className="px-2 py-1 hover:bg-purple-50 cursor-pointer text-red-600"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <LogOut className="h-4 w-4" />
                      <span>退出</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? '连接中...' : '登录MetaMask'}
            </Button>
          )}
        </div>
      </header>
      <div className="bg-purple-100 backdrop-blur-lg p-2 border-t border-b border-gray-200 flex items-center justify-center w-full mx-auto">
        <div className="flex items-center space-x-2">
          <span>🚀 PlatON Ecosystem Tour - Hopscotch Adventure 🎮 </span>
          <Link href="./event" className="text-orange-500 hover:underline">
            → Join
          </Link>
        </div>
      </div>
      <main className="flex-grow p-4 max-w-md mx-auto w-full mt-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center"> 
            <TabsList className="grid max-w-xs grid-cols-4 bg-purple-100 p-1 rounded-lg">
              <TabsTrigger
                value="assets"
                className="rounded-md data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                资产
              </TabsTrigger>
              <TabsTrigger
                value="transferRecords"
                className="rounded-md data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                ref={transferTabRef}
              >
                转账
              </TabsTrigger>
              <TabsTrigger
                value="transactionRecords"
                className="rounded-md data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                交易记录
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="rounded-md data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                联系人
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="assets" className="mt-6 border-2 border-white rounded-lg p-4 shadow-2xl">
            {!account ? (
              <>
                <h2 className="text-xl font-semibold mb-4">资产</h2>
                <div className="bg-purple-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-center mb-2">
                    登录 MetaMask 可以存入和管理资产
                  </p>
                  <Button className="w-full bg-white text-purple-600 hover:bg-gray-100" onClick={connectWallet}>
                    登录MetaMask
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h2 className="text-lg font-medium">
                      {displayName || truncateAddress(account)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {truncateAddress(account)} 
                      <Copy 
                        className="h-4 w-4 inline ml-1 cursor-pointer" 
                        onClick={() => copyToClipboard(account)} 
                      />
                    </p>
                  </div> 
                  <div className="flex gap-2">
                    <button 
                      className="p-2 bg-purple-100 rounded-full" 
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="border-b border-gray-200" />
                <div className="bg-purple-500 text-white p-6 rounded-lg">
                  <div className="opacity-80 text-sm mb-2">总资产估值($)</div>
                  <div className="text-3xl font-bold">
                    ${(
                      parseFloat(balances.LAT) * latRate +
                      parseFloat(balances.USDT) +
                      parseFloat(balances.USDC)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 mb-6 mt-3 bg-purple-50 p-4 rounded-lg shadow-2xl">
              <div 
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => handleQRCodeClick('充值')}
              >
                <Image src="/deposit.svg" alt="充值" width={24} height={24} className="mb-1" />
                <span className="text-xs text-gray-600">充值</span>
              </div>
              <div 
                className="flex flex-col items-center justify-center border-l border-gray-200 cursor-pointer"
                onClick={() => handleQRCodeClick('收款')}
              >
                <Image src="/receive-code-9b78545b.svg" alt="收款" width={24} height={24} className="mb-1" />
                <span className="text-xs text-gray-600">收款</span>
              </div>
              <div 
                className="flex flex-col items-center justify-center border-l border-gray-200 cursor-pointer"
                onClick={handleTransferClick}
              >
                <Image src="/swap.svg" alt="转账" width={24} height={24} className="mb-1" />
                <span className="text-xs text-gray-600">转账</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">资产名称</span>
              <span className="text-sm font-medium flex items-center">
                <p className="text-xs text-gray-500">余额</p>
              </span>
            </div>
            <div className="space-y-4">
              {Object.entries(balances).map(([asset, balance]) => (
                <div key={asset} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image 
                      src={`/${asset.toLowerCase()}.png`}
                      alt={`${asset} logo`} 
                      width={40} 
                      height={40} 
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-xl">{asset}</div>
                      <div className="text-xs text-gray-500">PlatON</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{parseFloat(balance).toFixed(4)}</div>
                    <div className="text-xs text-gray-500">
                      ≈ ${(parseFloat(balance) * (asset === 'LAT' ? latRate : 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="transferRecords" id="transfer-section" className="mt-6 border-2 border-white rounded-lg p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-10 border-b h-16">
              <h2 className="text-lg font-light">转账</h2>
              <div className="flex space-x-2">
                <Image 
                  src="./download.svg" 
                  alt="Download" 
                  width={24} 
                  height={24} 
                  className="cursor-pointer"
                  onClick={() => handleQRCodeClick('收款')}
                />
                <Image 
                  src="./qr-code.svg" 
                  alt="QR Code" 
                  width={24} 
                  height={24} 
                  className='border-l cursor-pointer'
                  onClick={() => handleQRCodeClick('收款')}
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">资产</label>
                <span className="text-xs text-gray-500">余额: {balances[selectedAsset as keyof typeof balances]}</span>
              </div>
              <div className="flex items-center mt-2 border rounded-md overflow-hidden h-11">
                <div className="flex-shrink-0 pl-2">
                  <Image src={`/${selectedAsset.toLowerCase()}.png`} alt={selectedAsset} width={24} height={24} />
                </div>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className=" w-20 border-0 focus:ring-0">
                    <SelectValue placeholder="选择资产" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAT">LAT</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="请输入转账数额"
                  value={amount}
                  onChange={handleAmountChange}
                  className="border-0 focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="mb-4 relative">
              <Input
                type="text"
                placeholder="请输入公共地址（0x）或域名"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full pr-10 h-11"
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setIsContactSelectorOpen(true)}
              >
                <Image src="./contact.svg" alt="User" width={24} height={24} />
              </button>
            </div>
            {transferError && <p className="text-red-500 text-sm mb-2">{transferError}</p>}
            <Button 
              className="w-full bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors" 
              disabled={!amount || !recipient || isTransferring}
              onClick={handleTransfer}
            >
              {isTransferring ? '转账中...' : '转账'}
            </Button>
          </TabsContent>
          <TabsContent value="transactionRecords" id="transaction-records-section" className="mt-6 border-2 border-white rounded-lg p-4 shadow-2xl">
            <TransactionRecords isLoggedIn={!!account} account={account} connectWallet={connectWallet} />
          </TabsContent>
          <TabsContent value="contacts" className="mt-6 border-2 border-white rounded-lg p-4 shadow-2xl h-[600px] ">
            <Contacts isLoggedIn={!!account} userId={account} onContactsChange={(newContacts) => setContacts(newContacts)} />
          </TabsContent>
        </Tabs>
      </main>
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        address={account}
        title={qrModalTitle}
      />
      <ContactSelector
        isOpen={isContactSelectorOpen}
        onClose={() => setIsContactSelectorOpen(false)}
        onSelect={handleContactSelect}
        contacts={contacts}
      />
      <TransferStatusDialog
        isOpen={showTransferStatus}
        onClose={() => setShowTransferStatus(false)}
        status={transferStatus}
        errorMessage={transferError}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        account={account}
        displayName={displayName}
        onUpdateName={setDisplayName}
      />
    </div>
  )
}

