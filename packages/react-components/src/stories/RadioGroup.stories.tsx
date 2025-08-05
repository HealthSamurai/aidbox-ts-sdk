import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Globe, 
  Truck, 
  Plane, 
  Car,
  Zap,
  Shield,
  Star,
  Users,
  Building
} from 'lucide-react';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="option-three" />
        <Label htmlFor="option-three">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("comfortable");

    return (
      <div className="space-y-4">
        <RadioGroup value={value} onValueChange={setValue}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="r1" />
            <Label htmlFor="r1">Default</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="comfortable" id="r2" />
            <Label htmlFor="r2">Comfortable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="compact" id="r3" />
            <Label htmlFor="r3">Compact</Label>
          </div>
        </RadioGroup>
        
        <div className="p-3 bg-muted rounded-md text-sm">
          Selected: <strong>{value}</strong>
        </div>
      </div>
    );
  },
};

export const PaymentMethods: Story = {
  render: () => {
    const [paymentMethod, setPaymentMethod] = useState("card");

    const paymentOptions = [
      {
        id: "card",
        name: "Credit Card",
        description: "Pay with Visa, Mastercard, or American Express",
        icon: CreditCard,
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Pay securely with your PayPal account",
        icon: Globe,
      },
      {
        id: "apple",
        name: "Apple Pay",
        description: "Pay with Touch ID or Face ID",
        icon: Smartphone,
      },
      {
        id: "bank",
        name: "Bank Transfer",
        description: "Direct transfer from your bank account",
        icon: Banknote,
      },
    ];

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you'd like to pay</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {paymentOptions.map((option) => (
              <div key={option.id} className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                    <option.icon className="h-4 w-4" />
                    <span className="font-medium">{option.name}</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  },
};

export const ShippingOptions: Story = {
  render: () => {
    const [shipping, setShipping] = useState("standard");

    const shippingOptions = [
      {
        id: "standard",
        name: "Standard Shipping",
        duration: "5-7 business days",
        price: "Free",
        icon: Truck,
      },
      {
        id: "express",
        name: "Express Shipping",
        duration: "2-3 business days",
        price: "$9.99",
        icon: Zap,
      },
      {
        id: "overnight",
        name: "Overnight Shipping",
        duration: "Next business day",
        price: "$24.99",
        icon: Plane,
      },
      {
        id: "pickup",
        name: "Store Pickup",
        duration: "Available today",
        price: "Free",
        icon: Car,
      },
    ];

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Shipping Options</CardTitle>
          <CardDescription>Select your preferred delivery method</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={shipping} onValueChange={setShipping}>
            {shippingOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                    <option.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">{option.duration}</div>
                    </div>
                  </Label>
                </div>
                <Badge variant={option.price === "Free" ? "secondary" : "outline"}>
                  {option.price}
                </Badge>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  },
};

export const PricingPlans: Story = {
  render: () => {
    const [plan, setPlan] = useState("pro");

    const plans = [
      {
        id: "basic",
        name: "Basic",
        price: "$9",
        period: "/month",
        features: ["10 projects", "5GB storage", "Email support"],
        icon: Users,
        popular: false,
      },
      {
        id: "pro",
        name: "Pro",
        price: "$29",
        period: "/month",
        features: ["Unlimited projects", "100GB storage", "Priority support", "Advanced analytics"],
        icon: Star,
        popular: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: "$99",
        period: "/month",
        features: ["Unlimited everything", "1TB storage", "24/7 phone support", "Custom integrations", "Dedicated manager"],
        icon: Building,
        popular: false,
      },
    ];

    return (
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-2">Select the plan that best fits your needs</p>
        </div>
        
        <RadioGroup value={plan} onValueChange={setPlan} className="grid md:grid-cols-3 gap-6">
          {plans.map((planOption) => (
            <div key={planOption.id} className="relative">
              <Label
                htmlFor={planOption.id}
                className={`block cursor-pointer rounded-lg border-2 p-6 transition-all hover:border-primary/50 ${
                  plan === planOption.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                {planOption.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <planOption.icon className="h-5 w-5" />
                    <h3 className="font-semibold">{planOption.name}</h3>
                  </div>
                  <RadioGroupItem value={planOption.id} id={planOption.id} />
                </div>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">{planOption.price}</span>
                  <span className="text-muted-foreground">{planOption.period}</span>
                </div>
                
                <ul className="space-y-2 text-sm">
                  {planOption.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <div className="mt-8 flex justify-center">
          <Button size="lg">
            Get Started with {plans.find(p => p.id === plan)?.name}
          </Button>
        </div>
      </div>
    );
  },
};

export const WithDisabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="d1" />
        <Label htmlFor="d1">Available Option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="d2" disabled />
        <Label htmlFor="d2" className="opacity-50">Disabled Option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="d3" />
        <Label htmlFor="d3">Another Available Option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-four" id="d4" disabled />
        <Label htmlFor="d4" className="opacity-50">Also Disabled</Label>
      </div>
    </RadioGroup>
  ),
};

export const FormExample: Story = {
  render: () => {
    const [notification, setNotification] = useState("all");
    const [theme, setTheme] = useState("system");

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Email Notifications</Label>
            <RadioGroup value={notification} onValueChange={setNotification}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="n1" />
                <Label htmlFor="n1">All notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="important" id="n2" />
                <Label htmlFor="n2">Important only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="n3" />
                <Label htmlFor="n3">No notifications</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-base font-semibold">Theme</Label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="t1" />
                <Label htmlFor="t1">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="t2" />
                <Label htmlFor="t2">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="t3" />
                <Label htmlFor="t3">System</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button className="w-full">Save Preferences</Button>
        </CardContent>
      </Card>
    );
  },
};