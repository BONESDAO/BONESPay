import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"

interface RewardDialogProps {
  isOpen: boolean
  onClose: () => void
  cellNumber: number
  cellType: "normal" | "surprise"
  reward?: string
}

export function RewardDialog({ isOpen, onClose, cellNumber, cellType, reward }: RewardDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle>{cellType === "surprise" ? "惊喜格子！" : "普通格子"}</DialogTitle>
                <DialogDescription>
                  {cellType === "surprise"
                    ? `恭喜获得 ${reward} 奖励！您获得了 ${cellNumber} 积分 ！`
                    : `您获得了 ${cellNumber} 积分 !`}
                </DialogDescription>
              </DialogHeader>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

