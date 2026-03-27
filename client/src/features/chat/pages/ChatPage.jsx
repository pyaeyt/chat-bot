import React from 'react'
import ChatSection from '../components/ChatSection'
import DashboardLayout from '../../dashboard/components/DashboardLayout'

const ChatPage = () => {
     return (
        <DashboardLayout>
            <div className="p-">
      <h1 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">
        Chat
      </h1>
      <ChatSection />
    </div>
        </DashboardLayout>
    
  )
}

export default ChatPage
