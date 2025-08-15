'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string
  email?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showName?: boolean
  showOnline?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm', 
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
}

const nameClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl'
}

export function UserAvatar({ 
  name, 
  email, 
  src, 
  size = 'md', 
  className,
  showName = false,
  showOnline = false 
}: UserAvatarProps) {
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const getGradientFromName = (str?: string) => {
    if (!str) return 'from-emerald-400 to-emerald-600'
    
    const colors = [
      'from-emerald-400 to-emerald-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-cyan-400 to-cyan-600',
      'from-orange-400 to-orange-600',
      'from-green-400 to-green-600'
    ]
    
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const initials = getInitials(name, email)
  const gradient = getGradientFromName(name || email)

  if (showName) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="relative">
          <div className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shadow-sm ring-2 ring-white',
            sizeClasses[size],
            gradient
          )}>
            {src ? (
              <img 
                src={src} 
                alt={name || email || 'User'} 
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              initials
            )}
          </div>
          {showOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
          )}
        </div>
        <div className="flex flex-col">
          <span className={cn('font-medium text-gray-900', nameClasses[size])}>
            {name || 'User'}
          </span>
          {email && (
            <span className="text-xs text-gray-500 truncate">
              {email}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shadow-sm ring-2 ring-white',
        sizeClasses[size],
        gradient
      )}>
        {src ? (
          <img 
            src={src} 
            alt={name || email || 'User'} 
            className="rounded-full object-cover w-full h-full"
          />
        ) : (
          initials
        )}
      </div>
      {showOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white"></div>
      )}
    </div>
  )
}
