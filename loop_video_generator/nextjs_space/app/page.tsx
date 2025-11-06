'use client'

import { useState } from 'react'
import { TaskCard } from '@/components/ui/task-card'
import { TaskForm } from '@/components/task-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Task {
  id: string
  title: string
  description: string
  category: string
  completed: boolean
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState('all')

  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    setTasks([
      ...tasks,
      {
        ...task,
        id: Math.random().toString(36).substr(2, 9),
        completed: false,
      },
    ])
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const toggleComplete = (id: string, completed: boolean) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed } : task
      )
    )
  }

  const editTask = (id: string) => {
    // Implement edit functionality
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'completed') return task.completed
    if (filter === 'active') return !task.completed
    return task.category === filter
  })

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Task Manager</h1>
          <TaskForm onSubmit={addTask} />
        </div>

        <div className="flex justify-between items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onComplete={toggleComplete}
              onDelete={deleteTask}
              onEdit={editTask}
            />
          ))}
          {filteredTasks.length === 0 && (
            <p className="text-center text-muted-foreground">No tasks found</p>
          )}
        </div>
      </div>
    </main>
  )
}