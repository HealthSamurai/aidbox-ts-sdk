import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '@/components/ui/calendar';
import * as React from 'react';

// Import CSS for design tokens
import '../hs.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-destructive rounded-md">
          <h3 className="text-sm font-medium text-destructive">Calendar Error</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {this.state.error?.message || 'Something went wrong rendering the Calendar'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const meta: Meta<typeof Calendar> = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ErrorBoundary>
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </ErrorBoundary>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-lg border"
      />
    );
  },
};

export const MultipleSelection: Story = {
  render: () => {
    const [dates, setDates] = React.useState<Date[] | undefined>([]);
    
    return (
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={setDates}
        className="rounded-lg border"
      />
    );
  },
};

export const RangeSelection: Story = {
  render: () => {
    const [dateRange, setDateRange] = React.useState<{
      from: Date | undefined;
      to: Date | undefined;
    }>({
      from: undefined,
      to: undefined,
    });
    
    return (
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={setDateRange}
        className="rounded-lg border"
        numberOfMonths={2}
      />
    );
  },
};

export const WithoutBorder: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
      />
    );
  },
};