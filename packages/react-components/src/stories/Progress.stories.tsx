import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  render: () => (
    <div className="w-[300px]">
      <Progress value={33} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <div className="flex justify-between">
        <Label>Loading...</Label>
        <span className="text-sm text-muted-foreground">33%</span>
      </div>
      <Progress value={33} />
    </div>
  ),
};

export const Complete: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <div className="flex justify-between">
        <Label>Complete</Label>
        <span className="text-sm text-muted-foreground">100%</span>
      </div>
      <Progress value={100} />
    </div>
  ),
};

export const Different: Story = {
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-2">
        <Label>25%</Label>
        <Progress value={25} />
      </div>
      <div className="space-y-2">
        <Label>50%</Label>
        <Progress value={50} />
      </div>
      <div className="space-y-2">
        <Label>75%</Label>
        <Progress value={75} />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-2">
        <label className="text-sm font-medium">Small (h-1)</label>
        <Progress value={33} className="h-1" />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Default (h-2)</label>
        <Progress value={33} />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Medium (h-3)</label>
        <Progress value={33} className="h-3" />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Large (h-4)</label>
        <Progress value={33} className="h-4" />
      </div>
    </div>
  ),
};

export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
      let interval: NodeJS.Timeout;
      
      if (isRunning && progress < 100) {
        interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              setIsRunning(false);
              return 100;
            }
            return prev + 1;
          });
        }, 50);
      }

      return () => clearInterval(interval);
    }, [isRunning, progress]);

    const handleStart = () => {
      if (progress >= 100) {
        setProgress(0);
      }
      setIsRunning(true);
    };

    const handleStop = () => {
      setIsRunning(false);
    };

    const handleReset = () => {
      setProgress(0);
      setIsRunning(false);
    };

    return (
      <div className="space-y-4 w-80">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleStart} 
            disabled={isRunning}
          >
            <Play className="h-4 w-4 mr-1" />
            {progress >= 100 ? 'Restart' : 'Start'}
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleStop}
            disabled={!isRunning}
          >
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    );
  },
};

export const FileUpload: Story = {
  render: () => {
    const [files] = useState([
      { name: 'document.pdf', progress: 100, status: 'completed' },
      { name: 'image.jpg', progress: 75, status: 'uploading' },
      { name: 'video.mp4', progress: 45, status: 'uploading' },
      { name: 'archive.zip', progress: 0, status: 'queued' },
    ]);

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Upload progress for multiple files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.map((file, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {file.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {file.status === 'uploading' && (
                    <Clock className="h-4 w-4 text-blue-500" />
                  )}
                  {file.status === 'queued' && (
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Badge 
                  variant={
                    file.status === 'completed' ? 'default' : 
                    file.status === 'uploading' ? 'secondary' : 'outline'
                  }
                >
                  {file.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={file.progress} className="flex-1" />
                <span className="text-xs text-muted-foreground w-10">
                  {file.progress}%
                </span>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between items-center text-sm">
            <span>Overall Progress</span>
            <span>2 of 4 files completed</span>
          </div>
          <Progress value={55} />
        </CardContent>
      </Card>
    );
  },
};