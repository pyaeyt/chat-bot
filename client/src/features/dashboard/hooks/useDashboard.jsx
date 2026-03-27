"use client"
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react'
import { getProfile } from '../../../services/profile';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);

    const router = useRouter();
    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await getProfile()
                setUser(data.user)
            } catch (err) {
                console.error(err)

                // invalid token → logout
                localStorage.removeItem("token")
                router.replace("/login")
            }
        }

        loadUser()
    }, [])

    return (
        <SidebarContext.Provider
            value={{
                open,
                setOpen,
                user,
                setUser,
            }}
        >
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
