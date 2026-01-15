"use client"

import * as React from "react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { Badge } from "@/components/UI/Badge"
import { Input } from "@/components/UI/Input"
import { Trash2, MessageCircle, Copy, Calendar, User, Phone, Edit2, Check, X } from "lucide-react"
import { getDrawHistory, updateDrawNote, deleteDrawRecord } from "@/lib/actions/draw"
import { APPEARANCE_LABELS, GENDER_LABELS } from "@/lib/types"
import type { DrawHistory } from "@/lib/types"
import Link from "next/link"

export default function HistoryPage() {
  const [history, setHistory] = React.useState<DrawHistory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null)
  const [noteText, setNoteText] = React.useState("")

  React.useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    const { history: data } = await getDrawHistory()
    if (data) {
      setHistory(data as DrawHistory[])
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return
    
    const result = await deleteDrawRecord(id)
    if (result.success) {
      setHistory(history.filter(item => item.id !== id))
    }
  }

  const startEditNote = (item: DrawHistory) => {
    setEditingNoteId(item.id)
    setNoteText(item.note || "")
  }

  const saveNote = async (id: string) => {
    const result = await updateDrawNote(id, noteText)
    if (result.success) {
      setHistory(history.map(item => 
        item.id === id ? { ...item, note: noteText } : item
      ))
    }
    setEditingNoteId(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 py-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">抽取记录</h1>
          <span className="text-gray-400 text-sm">共 {history.length} 条记录</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 opacity-20" />
            </div>
            <p className="mb-4">还没有抽取记录哦</p>
            <Link href="/draw">
              <Button>去邂逅</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${item.target?.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                        {item.target?.gender === 'female' ? '👩' : '👨'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <h3 className="font-bold text-gray-800">{item.target?.nickname || '神秘用户'}</h3>
                          {item.target?.location && (
                            <Badge variant="secondary" className="text-xs">{item.target.location}</Badge>
                          )}
                          {item.target?.appearance && (
                            <Badge variant="outline" className="text-xs">{APPEARANCE_LABELS[item.target.appearance]}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {item.target?.age}岁 · {item.target?.gender ? GENDER_LABELS[item.target.gender] : ''}
                          {item.target?.grade && ` · ${item.target.grade}`}
                        </p>
                        
                        <div className="flex items-center space-x-3 pt-2 flex-wrap gap-2">
                          {item.contact_wechat && (
                            <div className="flex items-center bg-green-50 px-3 py-1 rounded-lg text-sm font-mono text-gray-600">
                              <MessageCircle className="w-3 h-3 mr-2 text-green-500" />
                              {item.contact_wechat}
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => copyToClipboard(item.contact_wechat!)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {item.contact_qq && (
                            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg text-sm font-mono text-gray-600">
                              <span className="mr-2 text-blue-500 text-xs">QQ</span>
                              {item.contact_qq}
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => copyToClipboard(item.contact_qq!)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {item.contact_phone && (
                            <div className="flex items-center bg-rose-50 px-3 py-1 rounded-lg text-sm font-mono text-gray-600">
                              <Phone className="w-3 h-3 mr-2 text-rose-500" />
                              {item.contact_phone}
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => copyToClipboard(item.contact_phone!)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xs text-gray-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> {formatDate(item.created_at)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        ¥{item.price.toFixed(2)}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Note section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {editingNoteId === item.id ? (
                      <div className="flex items-center space-x-2">
                        <Input 
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="添加备注..."
                          className="flex-1"
                        />
                        <Button size="icon" variant="ghost" className="text-green-500" onClick={() => saveNote(item.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-gray-400" onClick={() => setEditingNoteId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : item.note ? (
                      <div 
                        className="p-3 bg-yellow-50/50 rounded-lg text-sm text-yellow-800 border border-yellow-100 flex items-start cursor-pointer hover:bg-yellow-50"
                        onClick={() => startEditNote(item)}
                      >
                        <span className="mr-2">📝</span>
                        {item.note}
                        <Edit2 className="w-3 h-3 ml-auto opacity-50" />
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="text-gray-400 text-sm"
                        onClick={() => startEditNote(item)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> 添加备注
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
