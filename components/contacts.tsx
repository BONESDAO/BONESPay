'use client'

import { useState, useEffect } from 'react'
import { Ghost, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { getContacts, addContact, deleteContact, updateContact } from '@/app/actions/contacts'
import { useToast } from "@/hook/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Contact {
  id: number
  name: string
  address: string
}

interface ContactsProps {
  isLoggedIn: boolean
  userId: string
  onContactsChange: (contacts: Contact[]) => void
}

export default function Contacts({ isLoggedIn, userId, onContactsChange }: ContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', address: '' })
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [addressError, setAddressError] = useState('')
  const contactsPerPage = 3
  const { toast } = useToast()

  const truncateAddress = (address: string, start: number = 6, end: number = 4) => {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchContacts()
    }
  }, [isLoggedIn, userId])

  const fetchContacts = async () => {
    try {
      const fetchedContacts = await getContacts(userId);
      setContacts(fetchedContacts);
      onContactsChange(fetchedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  }

  const validateAddress = (address: string) => {
    const hexRegex = /^0x[a-fA-F0-9]{40}$/;
    const hashRegex = /^[a-fA-F0-9]{64}$/;
    return hexRegex.test(address) || hashRegex.test(address);
  }

  const handleAddContact = async () => {
    if (newContact.name && newContact.address) {
      if (!validateAddress(newContact.address)) {
        setAddressError('请输入有效的0x开头地址或64位哈希地址');
        return;
      }
      try {
        const addedContact = await addContact(userId, newContact.name, newContact.address);
        const updatedContacts = [...contacts, addedContact];
        setContacts(updatedContacts);
        onContactsChange(updatedContacts);
        setNewContact({ name: '', address: '' });
        setIsAddingContact(false);
        setAddressError('');
      } catch (error) {
        console.error('Error adding contact:', error);
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletingContact) {
      try {
        await deleteContact(userId, deletingContact.id);
        const updatedContacts = contacts.filter(contact => contact.id !== deletingContact.id);
        setContacts(updatedContacts);
        onContactsChange(updatedContacts);
        setDeletingContact(null);
        toast({
          title: "删除成功",
          description: "联系人已被删除",
        })
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  }

  const handleUpdateContact = async () => {
    if (editingContact) {
      if (!validateAddress(editingContact.address)) {
        setAddressError('请输入有效的0x开头地址或64位哈希地址');
        return;
      }
      try {
        const updatedContact = await updateContact(userId, editingContact.id, editingContact.name, editingContact.address);
        const updatedContacts = contacts.map(contact => 
          contact.id === updatedContact.id ? updatedContact : contact
        );
        setContacts(updatedContacts);
        onContactsChange(updatedContacts);
        setEditingContact(null);
        setAddressError('');
      } catch (error) {
        console.error('Error updating contact:', error);
      }
    }
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      toast({
        title: "复制成功",
        description: "地址已复制到剪贴板",
      })
    }).catch(err => {
      console.error('复制失败:', err);
    });
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">联系人</h1>
        {isLoggedIn && (
          <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-purple-300">
                <span className="mr-1">➕</span> 添加联系人
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px] p-0 gap-0">
              <div className="p-6">
                <DialogHeader className="flex flex-row items-center justify-between p-0 mb-6">
                  <DialogTitle className="text-lg font-medium">添加联系人</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">联系人名称</label>
                    <Input
                      placeholder="联系人名称"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="bg-[#F8F7FD] border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">联系人地址</label>
                    <Input
                      placeholder="联系人地址"
                      value={newContact.address}
                      onChange={(e) => {
                        setNewContact({ ...newContact, address: e.target.value });
                        setAddressError('');
                      }}
                      className="bg-[#F8F7FD] border-0"
                    />
                    {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
                  </div>
                  <Button 
                    onClick={handleAddContact} 
                    className="w-full bg-[#F8F7FD] text-black hover:bg-[#EEEDF7]"
                  >
                    添加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <Ghost className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">尚未添加任何联系人</p>
          {!isLoggedIn ? (
            <Link 
              href="/login" 
              className="text-primary hover:underline"
            >
              登录 / 注册
            </Link>
          ) : (
            <Button variant="secondary" onClick={() => setIsAddingContact(true)}>立即添加</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {currentContacts.map((contact) => (
            <div 
              key={contact.id}
              className="p-4 rounded-lg border bg-card group hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{truncateAddress(contact.address)}</p>
                </div>
                <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleCopyAddress(contact.address)}>复制</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingContact(contact)}>编辑</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeletingContact(contact)}>删除</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contacts.length > contactsPerPage && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(contacts.length / contactsPerPage) }, (_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-[400px] p-0 gap-0">
            <div className="p-6">
              <DialogHeader className="flex flex-row items-center justify-between p-0 mb-6">
                <DialogTitle className="text-lg font-medium">编辑联系人</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">联系人名称</label>
                  <Input
                    placeholder="联系人名称"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="bg-[#F8F7FD] border-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">联系人地址</label>
                  <Input
                    placeholder="联系人地址"
                    value={editingContact.address}
                    onChange={(e) => {
                      setEditingContact({ ...editingContact, address: e.target.value });
                      setAddressError('');
                    }}
                    className="bg-[#F8F7FD] border-0"
                  />
                  {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
                </div>
                <Button 
                  onClick={handleUpdateContact} 
                  className="w-full bg-[#F8F7FD] text-black hover:bg-[#EEEDF7]"
                >
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>删除联系人</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>确定要删除联系人 "{deletingContact?.name}" 吗？</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingContact(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

