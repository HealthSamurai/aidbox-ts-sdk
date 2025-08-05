import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const meta: Meta = {
  title: 'Components/DatePicker',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();

    return (
      <div className="w-[280px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

export const WithPresets: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();

    const presets = [
      {
        label: 'Today',
        date: new Date(),
      },
      {
        label: 'Tomorrow',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        label: 'In 3 days',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        label: 'In a week',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    return (
      <div className="w-[280px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="flex flex-col border-r">
                <div className="p-3 pb-2">
                  <p className="text-sm font-medium">Quick select</p>
                </div>
                <div className="flex flex-col p-1">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      className="justify-start h-auto p-2 text-sm"
                      onClick={() => setDate(preset.date)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

export const DateRange: Story = {
  render: () => {
    const [dateRange, setDateRange] = useState<{
      from: Date | undefined;
      to: Date | undefined;
    }>({
      from: undefined,
      to: undefined,
    });

    return (
      <div className="w-[300px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

export const WithClearButton: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();

    return (
      <div className="w-[280px] space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
              {date && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-auto p-1 hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDate(undefined);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => {
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    };

    return (
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Event Planning</CardTitle>
          <CardDescription>
            Select start and end dates for your event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => {
                      return date < new Date() || (startDate && date < startDate);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!startDate || !endDate}
          >
            {submitted ? 'Event Created!' : 'Create Event'}
          </Button>

          {startDate && endDate && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">Event Duration</p>
              <p className="text-muted-foreground">
                {format(startDate, 'PPP')} - {format(endDate, 'PPP')}
              </p>
              <p className="text-muted-foreground">
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
};