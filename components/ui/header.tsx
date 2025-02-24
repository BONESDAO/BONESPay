import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Wallet, User, Users, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'

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

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [account, setAccount] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedAccount = localStorage.getItem('connectedAccount')
    if (savedAccount) {
      setAccount(savedAccount)
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请安装 MetaMask 插件')
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const newAccount = accounts[0]
      setAccount(newAccount)
      localStorage.setItem('connectedAccount', newAccount)
      toast.success('连接成功')
    } catch (error) {
      console.error('连接错误:', error)
      toast.error('连接失败，请重试')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLogout = () => {
    setAccount('')
    localStorage.removeItem('connectedAccount')
    setIsOpen(false)
    toast.success('已退出登录')
  }

  return (
    <header className={`flex items-center justify-between p-4 bg-white border-b border-gray-200 ${className || ''}`}>
      <div className="flex items-center space-x-4">
        <Link href='/' className="flex items-center space-x-4">
          <Image src="/Dew.png" alt="BONESPay logo" width={32} height={32} className="w-8 h-8" />
          <h1 className="text-2xl font-bold">DeworkPay</h1>
        </Link>
        <nav className="hidden md:flex space-x-4 border-l">
          {/* <Link href="https://bones.icu/" className="text-sm font-medium ml-8">BONESDAO</Link> */}
          <Link href="https://register.deworkhub.com/" className="text-sm font-medium ml-8">Register</Link>
          <Link href="https://scan.platon.network/" className="text-sm font-medium">PlatScan</Link>
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
          <a href="./pools" className="text-sm font-medium">Pools</a>
          <a href="./event" className="text-sm font-medium">Event</a>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Image src="/languages.svg" alt="Language" width={20} height={20} className="mr-0" />
        </Button>
        <Button variant="ghost" size="sm">
          <Image src="/receive-code.svg" alt="QR Code" width={20} height={20} />
        </Button>
        <Button variant="ghost" size="sm">
          <Image src="/history.svg" alt="Notification" width={20} height={20} />
        </Button>

        {account ? (
          <div className="relative">
            <Button 
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2"
            >
              <span className="truncate max-w-[150px]">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-2 py-1 hover:bg-purple-50 cursor-pointer">
                  <div className="flex items-center gap-2 p-2">
                    <Wallet className="h-4 w-4" />
                    <span>钱包</span>
                  </div>
                </div>
                <div className="px-2 py-1 hover:bg-purple-50 cursor-pointer">
                  <div className="flex items-center gap-2 p-2">
                    <User className="h-4 w-4" />
                    <span>账户信息</span>
                  </div>
                </div>
                <div className="px-2 py-1 hover:bg-purple-50 cursor-pointer">
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
  )
}

