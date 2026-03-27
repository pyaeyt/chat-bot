import React, { useEffect, useState } from 'react'
import { getProfessors } from '../../../services/professors'

export default function useProfessor() {
    const [professors, setProfessors] = useState([])
    const token = localStorage.getItem("token")

    useEffect(() => {
            const loadProfessors = async () => {
                try {
                    const data = await getProfessors()
                    setProfessors(data.professors)
                } catch (err) {
                    console.error(err)
    
                }
            }
    
            loadProfessors()
        }, [])

  return (
    {
        professors,
        setProfessors
    }
  )
}
