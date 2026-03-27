import React from 'react'
import useProfessor from '../hooks/useProfessor';

export default function AskProfessorHeader() {
    // const professor = {
    //     name: "Dr. Demo Professor",
    //     email: "professor@edu.local",
    //     title: "Professor (Demo)",
    //     officeHours: "Mon & Wed 2:00–4:00 PM — Room 101 or by appointment",
    // } 
    const {professor} = useProfessor();
    return (
        <div className='flex items-center justify-between'>
            <div>
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    Ask Professors
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                    Choose a professor and send a message to their inbox.
                </p>
            </div>

            {/* Professor Card */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 mb-6 bg-neutral-50 dark:bg-neutral-800">
                <p className="text-sm text-neutral-500 mb-1">Professor</p>
                <p className="font-medium text-neutral-900 dark:text-white">
                    {professor.name} ({professor.email})
                </p>
            </div>
        </div>
    )
}
