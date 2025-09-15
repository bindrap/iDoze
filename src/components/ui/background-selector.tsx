'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Settings, Upload, Palette } from 'lucide-react'

type BackgroundOption = {
  id: string
  name: string
  path: string
  description: string
}

const defaultBackgrounds: BackgroundOption[] = [
  {
    id: 'default',
    name: 'Default',
    path: '',
    description: 'Clean gradient background'
  },
  {
    id: 'tecumseh',
    name: 'Tecumseh Lake',
    path: '/images/backgrounds/tecumseh.jpg',
    description: 'Beautiful lakeside sunset'
  },
  {
    id: 'road',
    name: 'Rain Drops',
    path: '/images/backgrounds/road_condensation.jpg',
    description: 'Artistic rainy window'
  },
  {
    id: 'mountains',
    name: 'Mountains',
    path: '/images/backgrounds/mountains.jpg',
    description: 'Dramatic mountain landscape'
  }
]

export function BackgroundSelector() {
  const [selectedBackground, setSelectedBackground] = useState<string>('default')
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load saved background preference
    const saved = localStorage.getItem('background-preference')
    if (saved) {
      setSelectedBackground(saved)
    }

    // Load custom background if exists
    const customBg = localStorage.getItem('custom-background')
    if (customBg) {
      setCustomBackground(customBg)
    }
  }, [])

  useEffect(() => {
    // Apply background using CSS custom properties
    const applyBackground = () => {
      console.log('Applying background:', selectedBackground)

      let backgroundValue = ''
      if (selectedBackground === 'custom' && customBackground) {
        console.log('Setting custom background:', customBackground)
        backgroundValue = `url(${customBackground})`
      } else if (selectedBackground !== 'default') {
        const background = defaultBackgrounds.find(bg => bg.id === selectedBackground)
        if (background?.path) {
          console.log('Setting background to:', background.path)
          backgroundValue = `url(${background.path})`
        }
      } else {
        console.log('Setting default gradient background')
        backgroundValue = 'linear-gradient(to bottom right, rgb(17, 24, 39), rgb(31, 41, 55), rgb(0, 0, 0))'
      }

      // Apply directly to the dashboard container
      const dashboardContainer = document.querySelector('[data-dashboard-container]')
      if (dashboardContainer) {
        const element = dashboardContainer as HTMLElement
        element.style.backgroundImage = backgroundValue
        element.style.backgroundSize = 'cover'
        element.style.backgroundPosition = 'center'
        element.style.backgroundAttachment = 'fixed'
        console.log('Applied background directly to dashboard container:', backgroundValue)
        console.log('Dashboard container found:', element)
      } else {
        console.error('Dashboard container not found!')
      }

      // Also set CSS custom property as backup
      const root = document.documentElement
      root.style.setProperty('--dashboard-bg', backgroundValue)
    }

    applyBackground()
  }, [selectedBackground, customBackground])

  const handleBackgroundChange = (backgroundId: string) => {
    setSelectedBackground(backgroundId)
    localStorage.setItem('background-preference', backgroundId)
  }

  const handleCustomUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCustomBackground(result)
        setSelectedBackground('custom')
        localStorage.setItem('custom-background', result)
        localStorage.setItem('background-preference', 'custom')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-4 right-4 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 z-50"
        >
          <Palette className="w-4 h-4 mr-2" />
          Background
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Background</DialogTitle>
          <DialogDescription>
            Select a background image or upload your own
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {defaultBackgrounds.map((background) => (
            <Card
              key={background.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedBackground === background.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleBackgroundChange(background.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{background.name}</CardTitle>
                <CardDescription className="text-xs">{background.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative bg-gray-100 rounded overflow-hidden">
                  {background.path ? (
                    <Image
                      src={background.path}
                      alt={background.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                      <span className="text-white text-sm">Default Gradient</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Custom Background Option */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedBackground === 'custom' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Custom Background</CardTitle>
              <CardDescription className="text-xs">Upload your own image</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video relative bg-gray-100 rounded overflow-hidden">
                {customBackground ? (
                  <Image
                    src={customBackground}
                    alt="Custom background"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-2">
                <Label htmlFor="background-upload" className="sr-only">
                  Upload background
                </Label>
                <Input
                  id="background-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• High resolution images (1920x1080 or larger) work best</li>
            <li>• Your preference is saved automatically</li>
            <li>• Background applies to all pages in the dashboard</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}