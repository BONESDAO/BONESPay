'use client'

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-l from-purple-50 to-[#FFFEFF]">
        <div className="relative p-12 overflow-hidden">
          {/* 毛玻璃遮罩层 */}
          <div className="absolute inset-0 backdrop-blur-md bg-white/30" />
          
          {/* 添加 DialogTitle 以解决可访问性警告 */}
          <DialogTitle className="sr-only">Coming Soon</DialogTitle>
          
          {/* 内容 */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-800/80 animate-fade-in mb-4">
              Coming Soon
            </div>
            <p className="text-gray-600 text-center">
              这个功能正在开发中，敬请期待！
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 